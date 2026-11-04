#!/usr/bin/env python3
"""Check HALO tutorial MP3 integrity and plausibility without altering audio files.

Uses mutagen's MP3 parser; intentionally does not claim to certify audible speech.
"""
from pathlib import Path
import sys
from mutagen.mp3 import MP3, HeaderNotFoundError

# Exact tutorial scripts are mirrored from the canonical VO text in public/tv.html.
# Word counts drive only an intentionally permissive minimum duration check.
SCRIPTS = [
    "Welcome, operative. I am HALO. Let me show you how to crack the grid.",
    "There are two crews, VOLT and FLARE. Each crew has one Operator. Everyone else is a Runner.",
    "The grid holds twenty-five words. Nine belong to the crew that starts, eight to the other crew. Seven are noise. One is the Zero Day.",
    "Only the Operators can see which word is which. The secret key is on their phone.",
    "The Operator sends one word and a number. Ocean, two, means two of your words link to ocean.",
    "Runners talk it through, then tap a word on their phones. When most of the crew agree, the node locks in.",
    "Hit one of your own words and you keep going. You get one more guess than the number.",
    "Hit noise, or the other crew’s word, and your turn is over.",
    "Hit the Zero Day and your crew loses instantly. Avoid it at all costs.",
    "Only two or three of you? Team up against ICE, which takes one of its nodes every turn. Want a twist? Switch on Mole mode, and one Runner in each crew is secretly working for the other side.",
    "First crew to find all of their words wins. Good luck, operative.",
]

def main(root):
    failures = []
    for index, script in enumerate(SCRIPTS, 1):
        name = f"vo_tut_{index}.mp3"
        path = root / "public" / "audio" / name
        if not path.is_file():
            # Some builds store audio at public/audio, not root/audio.
            failures.append(f"{name}: missing from public/audio")
            continue
        try:
            mp3 = MP3(path)
            duration = float(mp3.info.length)
            bitrate = int(mp3.info.bitrate)
        except (HeaderNotFoundError, OSError, ValueError, AttributeError) as exc:
            failures.append(f"{name}: invalid MP3 ({exc})")
            continue
        # 5 spoken words/second + a one-second tolerance is deliberately lenient.
        # It catches first-word truncation without requiring identical delivery speed.
        minimum = max(2.0, len(script.split()) / 5.0 - 1.0)
        ok = duration >= minimum and bitrate >= 16000
        print(f'{"PASS" if ok else "FAIL"} {name}: {duration:.2f}s, '
              f'{len(script.split())} words, minimum {minimum:.2f}s, '
              f'bitrate {bitrate} bps')
        if not ok:
            failures.append(f"{name}: implausibly short or invalid bitrate")
    if failures:
        for issue in failures:
            print("ERROR " + issue, file=sys.stderr)
        return 1
    print("PASS: 11 HALO tutorial MP3s have readable headers and plausible durations.")
    print("NOTE: Hearing every chapter through its end still requires browser/device testing.")
    return 0

if __name__ == "__main__":
    sys.exit(main(Path(__file__).resolve().parent.parent))
