"""Deterministically render five original seamless ambient horror loops.
Only Python stdlib is required. Output WAV 16-bit mono, 11025 Hz.
Run: python3 scripts/generate_audio.py
"""
from pathlib import Path
from math import sin, pi, exp
import random, wave, struct

ROOT = Path(__file__).resolve().parent.parent / 'assets' / 'audio'
ROOT.mkdir(parents=True, exist_ok=True)
SR = 11025
DURATION = 24
ROOTS = [41.2, 43.65, 38.89, 49.0, 36.71]
NAMES = ['01_the_maze', '02_the_ward', '03_the_foundry', '04_the_transmission', '05_the_heart']


def generate(index, root, name):
    random.seed(98723 + 97 * index)
    n = DURATION * SR
    data = [0.0] * n
    # Five voices: analog drones, distant detuned intervals, sub-bass heartbeat.
    phase = [0.0] * 5
    ratios = [1, 1.0048, 1.4987, 1.997, 0.5]
    amps = [0.23, 0.15, 0.085, 0.07, 0.16]
    noise = 0
    whisper = 0.0
    beat_positions = [2.6, 7.4, 13.3, 18.1, 21.8]
    for i in range(n):
        t = i / SR
        v = 0.0
        for j, (ratio, amp) in enumerate(zip(ratios, amps)):
            vibrato = 1 + 0.003 * sin(2 * pi * (0.08 + 0.011 * index) * t + j)
            phase[j] += 2 * pi * root * ratio * vibrato / SR
            v += amp * sin(phase[j])
        # Infrasonic amplitude movement, restrained radio hiss, rolling machinery.
        v *= 0.62 + 0.23 * sin(2 * pi * (0.09 + index * 0.015) * t)
        noise = noise * 0.994 + (random.random() * 2 - 1) * 0.006
        v += noise * (0.22 + 0.2 * index / 5)
        # Low-passed breath, muffled intercom and chapter-specific unstable motors.
        whisper = whisper * .986 + (random.random() * 2 - 1) * .014
        breath = .5 + .5 * sin(2*pi*(.13+index*.02)*t)
        v += whisper * breath * (.12 + .03 * index)
        v += .033 * sin(2*pi*(11.2+index*2.3)*t) * (1+sin(2*pi*.35*t))
        for k, onset in enumerate(beat_positions):
            attack = (t-onset) % DURATION
            if 0 <= attack < 1.25:
                fall = exp(-attack*(3.7+k*.12))
                v += (0.07+.015*index) * fall * sin(2*pi*(101+index*23-k*11)*t + .12*sin(2*pi*5*t))
        beat = (t * (0.75 + index * 0.09)) % 1.0
        if beat < 0.27:
            v += (0.10 + 0.018 * index) * exp(-beat * 21) * sin(2 * pi * (47 + index * 4) * t)
        # Four original, faint descending tones emerge at separated intervals.
        for j, onset in enumerate([1.4, 4.2, 7.1, 9.8, 14.2, 17.7, 20.6]):
            dt = (t - onset) % DURATION
            if dt < 1.5:
                pitch = root * [4.0, 3.0, 2.83, 2.0][(j + index) % 4]
                v += .045 * exp(-dt * 2.5) * sin(2 * pi * pitch * t)
        data[i] = v
    # Loop-end crossfade: last 1.2 s blends into first 1.2 s.
    fade = int(SR * 1.2)
    for i in range(fade):
        alpha = i / fade
        tail = n - fade + i
        data[tail] = data[tail] * (1 - alpha) + data[i] * alpha
    peak = max(max(data), -min(data), 0.01)
    with wave.open(str(ROOT / f'{name}.wav'), 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        wav.writeframes(struct.pack('<' + 'h' * n, *[int(max(-1, min(1, value / peak * .72)) * 32767) for value in data]))
    print(f'Rendered {name}.wav : {n / SR}s')


if __name__ == '__main__':
    for i, (root, name) in enumerate(zip(ROOTS, NAMES)):
        generate(i, root, name)
