"""Edge TTS with word timings, for reel-studio.

Reads the text from stdin, writes the MP3 and a JSON list of words: [{"w": word, "t": start_s, "d": duration_s}].
The service answers unreliably, so the call is retried. Requires the edge-tts package (pip install edge-tts).

Usage: python3 edge_tts_words.py --voice ru-RU-DmitryNeural --rate +0% --pitch -2Hz --audio out.mp3 --words out.json < text
"""
import argparse
import asyncio
import json
import sys

import edge_tts


async def synth(text, voice, rate, pitch, attempts):
    for _ in range(attempts):
        audio, words = bytearray(), []
        try:
            stream = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary='WordBoundary').stream()
            async for chunk in stream:
                if chunk['type'] == 'audio':
                    audio += chunk['data']
                elif chunk['type'] == 'WordBoundary':
                    words.append({'w': chunk['text'], 't': chunk['offset'] / 1e7, 'd': chunk['duration'] / 1e7})
            if audio and words:
                return audio, words
        except Exception:  # the service drops connections; retry
            pass
        await asyncio.sleep(1.5)
    return None, None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--voice', required=True)
    ap.add_argument('--rate', default='+0%')
    ap.add_argument('--pitch', default='+0Hz')
    ap.add_argument('--audio', required=True)
    ap.add_argument('--words', required=True)
    ap.add_argument('--attempts', type=int, default=20)
    a = ap.parse_args()
    text = sys.stdin.read().strip()
    audio, words = asyncio.run(synth(text, a.voice, a.rate, a.pitch, a.attempts))
    if not audio:
        sys.exit(f'edge-tts returned no audio after {a.attempts} attempts; try again later or rephrase the line')
    with open(a.audio, 'wb') as f:
        f.write(audio)
    with open(a.words, 'w', encoding='utf-8') as f:
        json.dump(words, f, ensure_ascii=False)


if __name__ == '__main__':
    main()
