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
🎯 Usage Guide
Controls
Button	Function
NEW EPISODE	Initialize a new random world with specified dimensions and pits
STEP	Perform one agent action (move, perceive, infer)
AUTO	Run agent continuously until victory or death
STOP	Halt autonomous exploration
Configuration
Setting	Range	Description
ROWS	2-6	Number of rows in the grid
COLS	2-6	Number of columns in the grid
PITS	1-8	Number of pits in the world (max 1/3 of total cells)
Scoring System
Action	Points
Starting score	0
Move to new cell	+25
Safe move (KB proven)	+15
Successful step	+10
Risky move (exploring unknown)	+5
Victory (explored all safe cells)	+200
Death (pit or Wumpus)	-50
🧠 Knowledge Base Implementation
CNF Clauses
The Knowledge Base stores information in Conjunctive Normal Form (CNF):

python
# Example: Cell (0,0) is safe
~P_0_0
~W_0_0

# Example: Breeze at (0,0) implies pit in adjacent cells
P_0_1 ∨ P_1_0
Resolution Algorithm
To prove a query α, add ¬α to KB

Repeatedly resolve pairs of clauses

If empty clause derived → α is entailed

If no new clauses generated → α not provable

📊 Metrics Display
The interface shows real-time performance metrics:

Metric	Description
Inference Steps	Number of clauses added to KB
Visited Cells	Count of explored safe cells
KB Clauses	Total clauses in Knowledge Base
Resolution Calls	Number of ASK queries performed
Resolution Steps	Total resolution operations
Steps Taken	Agent moves executed
Score	Current cumulative score
🎨 Visual Elements
Cell Types and Icons
Icon	Meaning	Description
A	Agent	Current agent position
O	Pit	Hazard - instant death
W	Wumpus	Creature - instant death
S	KB-Proven Safe	Unvisited cell proven safe by logic
?	Frontier	Unknown, unvisited cell
(blank)	Visited Safe	Explored safe cell
Percept Indicators
Icon	Meaning
B	Breeze detected (adjacent pit)
S	Stench detected (adjacent Wumpus)
Color Coding
Color	Element
Green	Visited safe cell
Light Blue	KB-proven safe (unvisited)
Yellow	Frontier cell (unexplored)
Gray	Unexplored cell
Red	Hazard (pit or Wumpus)
Dark Blue	Agent position
🔬 Technical Details
Inference Engine
Resolution Refutation: Complete inference algorithm for propositional logic

Iterative Deepening: Limits resolution depth to prevent infinite loops

Caching: Stores proven facts to avoid redundant computation

World Generation
Random pit placement (guarantees start cell safety)

Wumpus placed away from start position

Configurable world size and hazard density

Maximum pits limited to 1/3 of total cells

Agent Decision Making
Identify frontier (unvisited adjacent cells)

Query KB for safe cells via resolution

Prioritize safe cells by Manhattan distance

Fall back to closest frontier if no safe cells proven
