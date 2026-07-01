#  The Corrupted Depths

A knowledge-based AI agent navigates a corrupted fantasy dungeon using propositional logic and resolution inference.

##  About

The Corrupted Depths is a game where an AI agent uses logical reasoning to explore a dangerous dungeon. The agent detects percepts like Corruption Aura and Putrid Decay to avoid deadly rifts and defeat the Corrupted Beast.

**Themes:**
- **Fantasy**: Knight hero, dungeon setting, mythical beast
- **Corrupted**: Dark visuals, Corruption Rifts, Corrupted Beast

##  How It Works

The AI agent uses a **Knowledge Base** with:
- **TELL**: Adds percepts to the Knowledge Base
- **ASK**: Queries the KB to determine if a cell is safe
- **Resolution**: Uses resolution principle to prove or disprove facts
- **Decision**: Chooses the nearest safe unexplored cell

##  Tech Stack

- **Backend**: Python, Flask
- **Frontend**: HTML5, CSS3, JavaScript
- **Audio**: Web Audio API
- **Fonts**: Cinzel, IBM Plex Mono

##  Screenshots

<img width="1919" height="874" alt="image" src="https://github.com/user-attachments/assets/90c65090-1186-476c-8cff-a2c95cfb9b2d" />
<img width="1911" height="869" alt="image" src="https://github.com/user-attachments/assets/382ae982-c82e-4085-854f-e81a16bd0ea9" />
<img width="309" height="322" alt="image" src="https://github.com/user-attachments/assets/f3c3272c-5e0a-4818-af21-5f7963786964" />


##  Features

- AI-powered decision making using propositional logic
- Interactive step-by-step gameplay
- Automated exploration mode
- Real-time metrics (inference steps, resolution calls, score)
- Procedural sound effects
- Keyboard shortcuts (N=New, S=Step, Space=Auto)

##  How to Play

1. Configure the dungeon (rows, columns, corruption rifts)
2. Click "New Episode"
3. Click "Step" to move the agent one step at a time
4. Or click "Auto" to watch the AI explore

##  Installation

```bash
# Clone the repository
git clone https://github.com/Asmakhan427/the-corrupted-depths.git

# Navigate to the project folder
cd the-corrupted-depths

# Install Flask
pip install flask

# Run the game
python app.py

# Open your browser
http://localhost:5000
