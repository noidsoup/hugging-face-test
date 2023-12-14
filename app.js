require("dotenv").config();
const fetch = require("node-fetch");

const HUGGINGFACEHUB_API_TOKEN = process.env.HUGGINGFACEHUB_API_TOKEN;
const OPENAI_API_TOKEN = process.env.OPENAI_API_TOKEN;

// img2text function
async function img2text(url) {
  console.log(url);
  const response = await fetch(
    `https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGINGFACEHUB_API_TOKEN}`,
      },
      body: JSON.stringify({ url: url }),
    }
  );
  const data = await response.json();
  return data[0].generated_text;
}

// generateStory function
async function generateStory(scenario) {
  const template = `Make a really bad joke about this. CONTEXT:${scenario}`;

  const response = await fetch(
    "https://api.openai.com/v1/engines/text-davinci-003/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: template,
        max_tokens: 50,
        temperature: 0.7,
      }),
    }
  );

  const data = await response.json();
  if (response.ok) {
    return data.choices[0].text.trim();
  } else {
    console.error("Error:", data);
    throw new Error("API request failed");
  }
}

async function topenAIText2speech(message) {
  const requestData = {
    model: "tts-1",
    input: message,
    voice: "alloy",
  };

  const requestOptions = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  };

  fetch("https://api.openai.com/v1/audio/speech", requestOptions)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      const contentType = response.headers.get("content-type");
      if (!contentType.includes("audio")) {
        throw new Error("Response is not an audio file");
      }
      return response.buffer();
    })
    .then((audioContent) => {
      require("fs").writeFileSync("speech.mp3", audioContent);
      console.log("Audio saved as speech.mp3");
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// text2speech function
async function text2speech(message) {
  const API_URL =
    "https://api-inference.huggingface.co/models/espnet/kan-bayashi_ljspeech_vits";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGINGFACEHUB_API_TOKEN}`,
      },
      body: JSON.stringify({ inputs: message }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");

    if (!contentType.includes("audio")) {
      throw new Error("Response is not an audio file");
    }

    const audioContent = await response.arrayBuffer();
    require("fs").writeFileSync("audio.wav", Buffer.from(audioContent));
  } catch (error) {
    console.error("Error in text2speech:", error);
  }
}

(async () => {
  try {
    const storyPrompt = await img2text(
      "https://images.unsplash.com/photo-1700324022450-f143742da6c1"
    );

    const story = await generateStory(storyPrompt);
    console.log(story);
    //await text2speech(story);
    await topenAIText2speech(story);
  } catch (error) {
    console.error("Error occurred:", error);
  }
})();

// takes an image url
// returns a text description of the image and passes that into openAI
