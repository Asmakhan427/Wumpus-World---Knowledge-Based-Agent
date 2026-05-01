# 🦇 Wumpus World - Knowledge-Based Agent

An intelligent agent that navigates the Wumpus World environment using propositional logic and resolution-based inference to make safe decisions.

## Overview

The Wumpus World is a classic AI problem where an agent must navigate a cave filled with pits and a deadly Wumpus creature. This implementation features a knowledge-based agent that uses logical inference to deduce safe paths and avoid hazards.

### Key Features

- **Knowledge-Based Agent**: Uses propositional logic to maintain and reason about world knowledge
- **Resolution Inference**: Implements resolution refutation for logical entailment
- **Real-time Visualization**: Interactive grid display showing agent position, visited cells, and percepts
- **Multiple Control Modes**: Manual step-by-step or autonomous exploration
- **Performance Metrics**: Tracks inference steps, resolution calls, visited cells, and score
- **Percept Tracking**: Displays breeze and stench detection at each visited cell

##  How It Works

### Agent Logic

1. **Perception**: Agent detects BREEZE (adjacent pit) and STENCH (adjacent Wumpus) at current cell
2. **Knowledge Update**: Percepts are added to Knowledge Base as logical clauses
3. **Inference**: Resolution algorithm queries safe neighboring cells
4. **Decision**: Agent moves to a proven safe cell or explores frontier if no safe cell is proven

### Logical Rules
