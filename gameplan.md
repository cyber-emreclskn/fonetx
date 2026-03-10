# PRD — Translate Game (Web MVP)

## 1. Project Overview

**Product Name:** Translate Game  
**Owner / Studio:** KAPO GAMES  
**Platform:** Web  
**Document Type:** Simple PRD for MVP  
**Primary Goal:** Build a lightweight competitive web game where two players try to write an English-looking version of a Turkish word so that it sounds close when read aloud.

---

## 2. Product Goal

Create a fast, simple, playable browser game with the following flow:

1. User enters a username.
2. User is matched with another online player.
3. Both players receive the same Turkish word.
4. Player can press a button to hear the Turkish word using browser TTS.
5. Player types an English-letter approximation of the Turkish pronunciation within 60 seconds.
6. System calculates a similarity score out of 100.
7. Scores of both players are compared.
8. Winner is shown.

This is an MVP focused on **simple gameplay**, **fast iteration**, and **low infrastructure complexity**.

---

## 3. Scope

### In Scope
- Username entry
- Random 1v1 matchmaking
- Single-round match
- Turkish word playback using browser TTS
- 60-second timer
- Text input submission
- Similarity scoring
- Winner determination
- Basic result screen
- WebSocket-based real-time match flow

### Out of Scope
- Voice recording from players
- Real audio similarity analysis
- Advanced ranking / leaderboard
- Login / signup / OAuth
- Friends / invite system
- Tournament mode
- Chat
- Mobile app
- Payment system

---

## 4. Core Gameplay

### Game Loop
1. Player opens the site.
2. Player enters username.
3. Player joins matchmaking queue.
4. System matches two players.
5. Match starts.
6. System shows a Turkish word.
7. Player presses "Listen" to hear the word in Turkish TTS.
8. Player types an English-style pronunciation guess.
9. Player submits before timeout or gets auto-submitted at 60s.
10. System scores both answers.
11. System compares scores.
12. Winner is shown.

### Example
- Given word: `bahçe`
- Turkish TTS says: `bahçe`
- Player writes: `bahche`
- System evaluates closeness to expected transliteration / pronunciation
- Score returned: e.g. `92/100`

---

## 5. Target Users

### Primary Users
- Casual competitive players
- Language game players
- Social web game users
- Users who enjoy pronunciation / wordplay mechanics

### User Motivation
- Quick fun
- Competitive scoring
- Funny pronunciation attempts
- Simple repeatable gameplay loop

---

## 6. MVP Success Criteria

A release is considered successful if:

- A user can enter a username and start queueing
- Two players can be matched in real time
- A shared word is shown to both players
- Turkish TTS playback works in browser
- Players can submit answers within 60 seconds
- Scoring returns a value between 0 and 100
- Winner is correctly determined and displayed
- Match flow completes without page refresh

---

## 7. Functional Requirements

## 7.1 Username Entry
- User must enter a username before joining game
- Username length: 3 to 20 characters
- Allowed characters:
  - letters
  - numbers
  - underscore
- Username does not require account creation
- Server assigns an internal session ID

### Acceptance Criteria
- Empty username cannot proceed
- Invalid username shows error
- Valid username enters queue

---

## 7.2 Matchmaking
- User joins a waiting queue
- System pairs first available two players
- A unique match room is created
- Both players receive same match ID and word

### Acceptance Criteria
- Two waiting players are matched automatically
- Both receive "match found" event
- Match starts only when two active players are connected

---

## 7.3 Game Round
- Match consists of one round in MVP
- Both players get same Turkish word
- Word is visible on screen
- 60-second countdown starts when round begins

### Acceptance Criteria
- Countdown starts for both players at same time
- Same word is shown to both players
- Round auto-ends at 60 seconds

---

## 7.4 Turkish TTS Playback
- A "Listen" button must play the Turkish word using browser speech synthesis
- Browser language config should prefer `tr-TR`
- If a Turkish voice is unavailable, fallback to default speech synthesis voice
- TTS must wait for voices to finish loading (`speechSynthesis.onvoiceschanged`) before selecting a voice
- Preferred SpeechSynthesisUtterance parameters:
  - `lang`: `tr-TR`
  - `rate`: `0.78` (slightly slower for clarity)
  - `pitch`: `1.0`
  - `volume`: `1.0`
  - Voice selection: pick the first voice whose `lang` starts with `tr`; if none exists fall back to default
- Cancel any previously playing utterance before starting a new one
- Do not create utterance until voices are confirmed ready

### Acceptance Criteria
- Clicking the button plays speech
- Same word can be replayed during round
- Playback does not reset timer
- Voice is selected from preloaded voice list, not before voices are ready

---

## 7.5 Input Submission
- Player types a Latin-letter approximation
- Player can edit answer until submitted or timeout
- Last input before submit is final
- If timer ends before manual submit, system auto-submits current input

### Acceptance Criteria
- Manual submit sends answer immediately
- Auto-submit occurs at timeout
- Empty submission is allowed but scores very low or zero

---

## 7.6 Scoring
MVP scoring will be **text-based**, not audio-waveform based.

### Scoring Approach
1. Normalize target Turkish word
2. Convert target word into expected English-style transliteration
3. Normalize player input
4. Compare similarity using string distance
5. Return score from 0 to 100

### Example Rules
- `ç -> ch`
- `ş -> sh`
- `ı -> i`
- `ö -> o` or `oe`
- `ü -> u` or `ue`
- `ğ -> optional soft handling`
- `c -> j`

### Acceptance Criteria
- Score must always be an integer 0–100
- More similar inputs must receive higher scores
- Exact expected transliteration should score near 100

---

## 7.7 Winner Determination
- Higher score wins
- If scores are equal:
  - either declare draw
  - or break tie with earliest submit time

### MVP Decision
- Recommended MVP rule: **draw on equal score**

### Acceptance Criteria
- Winner shown correctly
- Draw shown correctly
- Both players see same result state

---

## 7.8 Result Screen
Result screen must show:
- player score (animated count-up)
- opponent score (animated count-up)
- winner / loser / draw state
- **Do NOT display** the original Turkish word, expected transliteration, or either player's typed answer

### Post-Game English TTS Playback
- After the result screen appears, automatically speak the **player's own typed answer** using English TTS
- Language: `en-US`
- This lets the player hear how their transliteration sounds when read in English
- Playback starts after a short delay (e.g. 600ms) so the score animation can begin first
- Use the same `speak()` abstraction with `lang: 'en-US'`

### Acceptance Criteria
- Result screen appears after both submissions or timeout
- Both clients receive consistent result payload
- No words or answers are displayed as text on the result screen
- Player's typed answer is spoken aloud in English after result is shown

---

## 8. Non-Functional Requirements

### Performance
- Matchmaking response should feel immediate
- Scoring should complete in under 500ms for MVP
- UI interactions should feel responsive

### Reliability
- If one player disconnects before match starts, room is cancelled
- If one player disconnects mid-match, match can end as forfeit or no-contest

### Simplicity
- System should be easy to deploy
- TTS must rely on browser-native APIs
- Backend logic should remain small and understandable

---

## 9. Recommended Tech Stack

## Frontend
- Next.js
- TypeScript
- Tailwind CSS
- socket.io-client
- Browser Web Speech API (`speechSynthesis`)

## Backend
- Node.js
- Express
- Socket.IO
- Redis (optional but recommended for queue / room state)

## Data Storage
### MVP Option A
- In-memory rooms + Redis for queue state

### MVP Option B
- PostgreSQL later for match history

## Deployment
- Vercel for frontend
- Railway / Render / VPS for backend
- Redis cloud or local Redis

---

## 10. Architecture Summary

### Client Responsibilities
- username form
- queue state UI
- match UI
- timer UI
- TTS playback
- text input
- submit action
- result rendering

### Server Responsibilities
- manage socket connections
- queue players
- create match rooms
- assign words
- receive submissions
- calculate scores
- determine winner
- broadcast result

---

## 11. Data Model (Simple)

## PlayerSession
- id
- username
- socketId
- status

## Match
- id
- player1Id
- player2Id
- word
- startedAt
- endedAt
- status

## Submission
- matchId
- playerId
- inputText
- score
- submittedAt

---

## 12. Basic API / Socket Contract

## Socket Events

### Client -> Server
- `queue:join`
- `queue:leave`
- `match:submit`
- `match:ready` (optional)

### Server -> Client
- `queue:joined`
- `queue:waiting`
- `match:found`
- `match:start`
- `match:tick`
- `match:result`
- `match:error`

---

## 13. Scoring Logic (Simple MVP)

### Step 1: Normalize Turkish Word
Example:
- `bahçe` -> lowercase
- remove unsupported symbols
- normalize known Turkish chars

### Step 2: Create Expected Transliteration
Example:
- `bahçe` -> `bahche`

### Step 3: Normalize User Input
Example:
- `BahChe  ` -> `bahche`

### Step 4: Compare
Use one of:
- Levenshtein distance
- Dice coefficient
- hybrid similarity method

### Step 5: Convert to 0–100
Example:
- perfect match -> 100
- close match -> 80–95
- moderate -> 50–79
- weak -> 0–49

---

## 14. Edge Cases

- Player submits empty input
- Player disconnects in queue
- Player disconnects during match
- Browser has no Turkish TTS voice
- One player submits early, other waits until timeout
- Both players submit same score
- Input contains invalid characters
- User refreshes page mid-match

---

## 15. UX Requirements

### Main Screens
1. Home / Username Screen
2. Matchmaking Screen
3. Game Screen
4. Result Screen

### UI Principles
- clean
- minimal
- fast
- competitive
- easy to understand

### Required UI Elements
- username input
- join button
- waiting indicator
- displayed Turkish word
- listen button
- 60-second countdown
- answer input
- submit button
- result card

---

## 16. Risks

### Risk 1: Browser TTS inconsistency
Different devices and browsers may use different Turkish voices.

**Mitigation:**  
Use browser-native TTS only for MVP reference playback, not for actual score computation.

### Risk 2: Scoring feels unfair
Simple text similarity may not always reflect pronunciation well.

**Mitigation:**  
Start with rule-based transliteration and tune with test words.

### Risk 3: Disconnects in live match
Real-time multiplayer can be interrupted.

**Mitigation:**  
Handle disconnect state and end match safely.

---

## 17. MVP Milestones

## Milestone 1 — Core Setup
- frontend skeleton
- backend socket server
- queue join / leave flow

## Milestone 2 — Match Flow
- match creation
- word assignment
- timer
- submit flow

## Milestone 3 — TTS + Scoring
- browser TTS playback
- transliteration rules
- similarity scoring
- result calculation

## Milestone 4 — Polish
- error states
- draw state
- disconnect handling
- better UI

---

## 18. Launch Definition

The MVP is launch-ready when:
- users can join and match consistently
- one full game completes end-to-end
- score appears correctly
- result is shared to both players
- no manual server intervention is required

---

## 19. Future Improvements

- ranked matchmaking
- leaderboard
- match history
- rematch button
- multiple rounds per match
- word difficulty levels
- categories
- friend invite
- audio-based pronunciation scoring
- voice cloning or standardized hosted TTS
- anti-cheat measures
- replay / analytics

---

## 20. Build Notes for Claude Code

### Priorities
1. Working multiplayer loop first
2. Browser TTS second
3. Simple scoring third
4. Nice UI last

### Do Not Overbuild
- do not introduce microservices for MVP
- do not add authentication yet
- do not add complex phoneme engines yet
- do not add database unless needed for match history

### Preferred Implementation Style
- clean folder structure
- small reusable components
- strongly typed socket payloads
- server-authoritative match state
- deterministic score calculation on server

---

## 21. One-Line Product Summary

Translate Game is a lightweight 1v1 web game where players hear a Turkish word and race to type the most pronunciation-accurate English-letter version, with the best score winning.