# WUMPUS WORLD - Knowledge-Based Agent

An intelligent agent that navigates the Wumpus World environment using propositional logic and resolution-based inference to make safe decisions.

## 📋 Overview

The Wumpus World is a classic AI problem where an agent must navigate a cave filled with pits and a deadly Wumpus creature. This implementation features a knowledge-based agent that uses logical inference to deduce safe paths and avoid hazards. The agent never relies on luck - every move is justified by logical deduction from its percepts.

## ✨ Features

- **Knowledge-Based Agent**: Uses propositional logic to maintain and reason about world knowledge
- **Resolution Inference**: Implements resolution refutation for logical entailment
- **Real-time Visualization**: Interactive grid display showing agent position, visited cells, and percepts
- **Multiple Control Modes**: Manual step-by-step or autonomous exploration
- **Performance Metrics**: Tracks inference steps, resolution calls, visited cells, and score
- **Percept Tracking**: Displays breeze and stench detection at each visited cell
- **Configurable World**: Adjustable grid size and number of pits

## 🎮 How It Works

### Agent Logic

1. **Perception**: Agent detects BREEZE (adjacent pit) and STENCH (adjacent Wumpus) at current cell
2. **Knowledge Update**: Percepts are added to Knowledge Base as logical clauses
3. **Inference**: Resolution algorithm queries safe neighboring cells
4. **Decision**: Agent moves to a proven safe cell or explores frontier if no safe cell is proven

### Logical Rules
B(i,j) → ∃ adjacent P(i,j) (Breeze implies adjacent pit)
S(i,j) → ∃ adjacent W(i,j) (Stench implies adjacent Wumpus)
¬B(i,j) → ∀ adjacent ¬P(i,j) (No breeze means no adjacent pits)
¬S(i,j) → ∀ adjacent ¬W(i,j) (No stench means no adjacent Wumpus)
Safe(i,j) → ¬P(i,j) ∧ ¬W(i,j) (Safe means no pit and no Wumpus)

text

## 🚀 Installation

### Prerequisites

- Python 3.8 or higher
- Flask

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/wumpus-world-kb-agent.git
cd wumpus-world-kb-agent
Install Flask

bash
pip install flask
Run the application

bash
python app.py
Open your browser and navigate to:

text
http://localhost:5000
📁 Project Structure
text
wumpus-world-kb-agent/
├── app.py                 # Flask backend with KB and agent logic
├── templates/
│   └── index.html        # Main UI template
├── static/
│   ├── style.css         # Styling (solid colors, no gradients)
│   └── script.js         # Frontend logic and API calls
└── README.md             # Project documentation

Fall back to closest frontier if no safe cells proven
