import {App, Plugin, PluginSettingTab, Setting, Notice, TFile} from "obsidian";
import OpenAI from "openai";

export default class DictationPlugin extends Plugin {
  mediaRecorder: MediaRecorder | null = null;
  audioChunks: BlobPart[] = [];
  openai!: OpenAI;
  settings!: DictationPluginSettings;
  isRecording: boolean = false;

  async onload() {
    console.log("Loading Dictation Plugin");
    await this.loadSettings();
    this.addSettingTab(new DictationSettingTab(this.app, this));
    this.openai = new OpenAI({
      apiKey: this.settings.openaiApiKey,
      dangerouslyAllowBrowser: true,
    });

    const ribbonIconEl = this.addRibbonIcon(
      "mic", // Icon name from the Lucide library
      "Start Dictation", // Tooltip text
      () => {
        this.toggleRecording(); // Function executed when clicked
      }
    );
    // Add CSS class to style the icon if needed
    ribbonIconEl.addClass("dictation-plugin-ribbon-icon");

    this.addCommand({
      id: "start-stop-dictation",
      name: "Start or Stop Dictation",
      callback: () => this.toggleRecording(),
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "D",
        },
      ],
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, {type: "audio/webm"});
        this.sendToWhisper(audioBlob);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      new Notice("Recording started...");
    } catch (error) {
      console.error("Error starting recording:", error);
      new Notice("Failed to start recording.");
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
      this.isRecording = false;
      new Notice("Recording stopped.");
    } else {
      new Notice("Recording is not active.");
    }
  }

  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  async sendToWhisper(audioBlob: Blob) {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const file = new File([buffer], "audio.webm", {type: "audio/webm"});

      const response = await this.openai.audio.transcriptions.create({
        file: file,
        model: "whisper-1",
        language: "ru",
      });

      const transcribedText = response.text;
      this.applyTemplate(transcribedText);
    } catch (error) {
      console.error("Error sending to Whisper API:", error);
      new Notice("Error during speech recognition.");
    }
  }

  async applyTemplate(transcribedText: string) {
    const template = `
# Note from {{date}}

## Summary
{{summary}}

## Transcribed Text
${transcribedText}

---

*Automatically created.*
`;

    const date = new Date().toLocaleDateString();
    const summary = await this.generateSummary(transcribedText);
    const content = template
      .replace("{{date}}", date)
      .replace("{{summary}}", summary);

    this.createNote(content);
  }

  async generateSummary(text: string): Promise<string> {
    try {
      const response = await this.openai.completions.create({
        model: "gpt-3.5-turbo-instruct",
        prompt: `Provide a brief summary of the following text:\n\n${text}`,
        max_tokens: 150,
        temperature: 0.7,
      });

      return response.choices[0].text.trim();
    } catch (error) {
      console.error("Error generating summary:", error);
      return "Failed to generate summary.";
    }
  }

  async openNoteInLeaf(file: TFile) {
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.openFile(file);
  }

  async createNote(content: string) {
    const fileName = `Note ${new Date().toISOString().replace(/:/g, "-")}.md`;
    try {
      const file = await this.app.vault.create(fileName, content);
      new Notice("Note created!");

      // Open the created note
      await this.openNoteInLeaf(file);
    } catch (error) {
      new Notice("Failed to create note.");
      console.error("Error creating note: ", error);
    }
  }
}

interface DictationPluginSettings {
  openaiApiKey: string;
  template: string;
}

const DEFAULT_SETTINGS: DictationPluginSettings = {
  openaiApiKey: "",
  template: `
# Note from {{date}}

## Summary
{{summary}}

## Transcribed Text
{{transcribedText}}

---
*Automatically created.*
`,
};

class DictationSettingTab extends PluginSettingTab {
  plugin: DictationPlugin;

  constructor(app: App, plugin: DictationPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const {containerEl} = this;

    containerEl.empty();

    containerEl.createEl("h2", {text: "Dictation Plugin Settings"});

    new Setting(containerEl)
      .setName("OpenAI API Key")
      .setDesc("Enter your OpenAI API key.")
      .addText((text) =>
        text
          .setPlaceholder("Enter your API key")
          .setValue(this.plugin.settings.openaiApiKey)
          .onChange(async (value) => {
            this.plugin.settings.openaiApiKey = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Note Template")
      .setDesc("Customize the template for your notes.")
      .addTextArea((textArea) =>
        textArea
          .setPlaceholder("Enter template")
          .setValue(this.plugin.settings.template)
          .onChange(async (value) => {
            this.plugin.settings.template = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
