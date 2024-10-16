# Dictation Plugin for Obsidian

This plugin allows you to quickly dictate notes in Obsidian using OpenAI's Whisper for speech-to-text and GPT-3.5 for summarization.

## Features

- **Start or Stop Recording** using `Cmd + Alt + D`, the ribbon icon, or the command palette.
- **Transcribe Audio** using OpenAI Whisper.
- **Summarize the Transcribed Text** using GPT-3.5 Turbo.
- **Create and Open a Note** with the transcription and summary automatically formatted.

## Usage

1. **Start Dictation**: Press `Cmd + Alt + D`, click the microphone icon in the sidebar, or use the command palette to start or stop recording.
2. **Transcription**: The recorded audio is sent to OpenAI Whisper for transcription.
3. **Summary**: The transcribed text is summarized using GPT-3.5 Turbo.
4. **Create Note**: The final note, including the summary and transcription, is created and automatically opened in Obsidian.

## Settings

- **OpenAI API Key**: You need to provide your OpenAI API key to use the transcription and summarization features.
- **Note Template**: Customize the template used for creating notes, including placeholders for the date, summary, and transcribed text.

## Installation

1. Clone or download the plugin repository.
2. Copy the plugin folder to your Obsidian vault's `.obsidian/plugins/` directory.
3. Enable the "Dictation Plugin" in Obsidian's community plugins settings.

## Requirements

- **OpenAI API Key**: Required for both transcription (Whisper) and summarization (GPT-3.5).
- **Obsidian**: Version 0.12.0 or higher.

## License

This plugin is licensed under the MIT License.

