import io
from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
def transcribe_audio(file_storage):
    try:
        file_bytes = file_storage.read()
        file_obj = io.BytesIO(file_bytes)
        file_obj.name = file_storage.filename

        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=file_obj
        )
        print("🧠 Transcription result:",response)

        return response.get("text") if hasattr(response, "get") else response.text

    except Exception as e:
        print(f"Whisper transcription failed: {e}")
        raise

