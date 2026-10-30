# Game audio

The game bundles four small PCM WAV files locally. No third-party audio server is contacted during play.

| Local file | Original asset | Creator / pack | License |
| --- | --- | --- | --- |
| card-slide.wav | card-slide-2.ogg | Kenney, Casino Audio 1.1 | CC0 |
| card-place.wav | card-place-1.ogg | Kenney, Casino Audio 1.1 | CC0 |
| gavel.wav | impactWood_heavy_000.ogg | Kenney, Impact Sounds 1.0 | CC0 |
| knock.wav | impactWood_light_000.ogg | Kenney, Impact Sounds 1.0 | CC0 |

Sources: [Casino Audio, uploaded by Kenney](https://opengameart.org/node/12742), [Impact Sounds official page](https://kenney.nl/assets/impact-sounds). Impact source files were downloaded from [this redistribution](https://github.com/GeorgeQLe/assets-sfx-combat/tree/main/assets/kenney/impact-sounds/Audio). Original license notices are included alongside this file.

Processing: silence trimmed, DC removed, short edge fades, mono 22,050 Hz PCM16, peak normalized to approximately −3 dBFS. Combined WAV size: 76,676 bytes. The heavy wood recording is pitch-shifted and layered with a low body and a quieter rebound for the gavel.

Campaign start, conviction, pause and resume use new instrumental chiptune arrangements of the opening of **Hail to the Chief**, James Sanderson's public-domain composition. The melody and dotted rhythms follow the [historical score in Johns Hopkins University's Levy Collection](https://levysheetmusic.mse.jhu.edu/collection/013/077). No modern recording or lyrics are included. Start is a dedicated 7.7-second, four-bar arrangement at 156 BPM: gavel, three-hit snare pickup, the full two-bar melody, an octave-up reprise, marching triangle bass and snare, and a closing D-major chord with a final wooden strike. Conviction plays the two-bar phrase an octave higher at 144 BPM with bass accompaniment and a final D-major cadence. Pause uses the first bar in a lower register; resume plays two bars an octave higher, resolving to the tonic.

Eleven repeatable effects use the six pitch classes found in the melody: D, E, F♯, A, B and C♯, with no immediate repeats. Short actions layer a single tuned note over the Foley. Outcome phrases preserve their contour while their lead and bass fundamentals are snapped to this palette; noisy wood and card layers retain their physical character with subtle playback-rate variation. Opening, pause, resume and conviction preserve the written melody and key in D. A separate audio-only generator chooses variants without consuming game randomness.

All remaining musical phrases and synthesis in sound.js are original to this game. A rounded pulse-wave lead, a bell overtone and triangle bass provide the arcade character. Audio respects the remembered mute control, user-gesture unlocking, hidden-tab suspension and bounded voice cleanup. If a sample cannot load, a procedural fallback plays immediately; a late download never replays the cue.
