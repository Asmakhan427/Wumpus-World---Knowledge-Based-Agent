"""
Wumpus World Knowledge-Based Agent
Flask Backend - Complete Fixed Version with Score Starting at 0
"""

from flask import Flask, render_template, jsonify, request
import random

app = Flask(__name__)

# ─── Global World State ────────────────────────────────────────────────────────
world_state = {}

# ─── Knowledge Base ────────────────────────────────────────────────────────────

class KnowledgeBase:
    """
    Propositional Logic Knowledge Base for the Wumpus World.
    """

    def __init__(self):
        self.clauses = []          # List of frozensets (CNF clauses)
        self.facts = set()         # Known positive facts
        self.negated_facts = set() # Known negative facts
        self.resolution_calls = 0
        self.resolution_steps = 0
        self.inference_steps = 0

    def tell(self, clause):
        """Add a clause to the KB."""
        if isinstance(clause, frozenset):
            if clause not in self.clauses:
                self.clauses.append(clause)
                self.inference_steps += 1
        elif isinstance(clause, str):
            fs = frozenset([clause])
            if fs not in self.clauses:
                self.clauses.append(fs)
                self.inference_steps += 1
                if clause.startswith('~'):
                    self.negated_facts.add(clause[1:])
                else:
                    self.facts.add(clause)

    def tell_safe(self, x, y):
        """Assert cell (x,y) has no pit and no wumpus."""
        self.tell(f'~P_{x}_{y}')
        self.tell(f'~W_{x}_{y}')

    def tell_pit(self, x, y):
        """Assert cell (x,y) definitely has a pit."""
        self.tell(f'P_{x}_{y}')

    def tell_wumpus(self, x, y):
        """Assert cell (x,y) definitely has the wumpus."""
        self.tell(f'W_{x}_{y}')

    def tell_breeze(self, x, y, rows, cols):
        """B(x,y) → at least one adjacent pit."""
        neighbors = get_neighbors(x, y, rows, cols)
        if neighbors:
            pit_clause = frozenset([f'P_{nx}_{ny}' for nx, ny in neighbors])
            self.clauses.append(pit_clause)
            self.inference_steps += 1

    def tell_no_breeze(self, x, y, rows, cols):
        """¬B(x,y) → no adjacent pits."""
        neighbors = get_neighbors(x, y, rows, cols)
        for nx, ny in neighbors:
            self.tell(f'~P_{nx}_{ny}')

    def tell_stench(self, x, y, rows, cols):
        """S(x,y) → adjacent wumpus."""
        neighbors = get_neighbors(x, y, rows, cols)
        if neighbors:
            wumpus_clause = frozenset([f'W_{nx}_{ny}' for nx, ny in neighbors])
            self.clauses.append(wumpus_clause)
            self.inference_steps += 1

    def tell_no_stench(self, x, y, rows, cols):
        """¬S(x,y) → no adjacent wumpus."""
        neighbors = get_neighbors(x, y, rows, cols)
        for nx, ny in neighbors:
            self.tell(f'~W_{nx}_{ny}')

    def ask_safe(self, x, y):
        """Query: is cell (x,y) safe? (no pit AND no wumpus)"""
        self.resolution_calls += 1
        no_pit = self._resolution_entails(f'~P_{x}_{y}')
        no_wumpus = self._resolution_entails(f'~W_{x}_{y}')
        return no_pit and no_wumpus

    def ask_pit(self, x, y):
        """Check if pit is proven at (x,y)."""
        return self._resolution_entails(f'P_{x}_{y}')

    def _resolution_entails(self, query):
        """Resolution refutation to prove query."""
        if query.startswith('~'):
            base = query[1:]
            if base in self.negated_facts:
                return True
            if base in self.facts:
                return False
        else:
            if query in self.facts:
                return True
            if query in self.negated_facts:
                return False

        negated_query = query[1:] if query.startswith('~') else f'~{query}'
        working_clauses = list(self.clauses) + [frozenset([negated_query])]
        seen = set(frozenset(c) for c in working_clauses)
        
        for iteration in range(100):
            new_clauses = []
            clause_list = list(working_clauses)
            
            for i in range(len(clause_list)):
                for j in range(i + 1, len(clause_list)):
                    resolvents = self._resolve(clause_list[i], clause_list[j])
                    self.resolution_steps += 1
                    
                    for r in resolvents:
                        if len(r) == 0:
                            return True
                        fs = frozenset(r)
                        if fs not in seen:
                            seen.add(fs)
                            new_clauses.append(fs)

            if not new_clauses:
                return False
            working_clauses.extend(new_clauses)
        
        return False

    def _resolve(self, c1, c2):
        """Resolve two clauses."""
        resolvents = []
        for lit in c1:
            complement = lit[1:] if lit.startswith('~') else f'~{lit}'
            if complement in c2:
                new_clause = (c1 - {lit}) | (c2 - {complement})
                resolvents.append(new_clause)
        return resolvents

    def clause_count(self):
        return len(self.clauses)

    def reset_step_counters(self):
        self.resolution_steps = 0


# ─── Helper Functions ──────────────────────────────────────────────────────────

def get_neighbors(x, y, rows, cols):
    """Return valid adjacent cells (up/down/left/right)."""
    candidates = [(x-1, y), (x+1, y), (x, y-1), (x, y+1)]
    return [(nx, ny) for nx, ny in candidates if 0 <= nx < rows and 0 <= ny < cols]


def init_world(rows, cols, num_pits):
    """Initialize a new Wumpus World with safe starting position."""
    total_cells = rows * cols
    max_pits = min(num_pits, total_cells // 3)
    if max_pits < 1:
        max_pits = 1
    
    start_cell = (0, 0)
    other_cells = [(r, c) for r in range(rows) for c in range(cols) if (r, c) != start_cell]
    
    pit_cells = []
    if max_pits > 0 and len(other_cells) > max_pits:
        pit_cells = random.sample(other_cells, max_pits)
    
    wumpus_eligible = [c for c in other_cells if c not in pit_cells]
    if not wumpus_eligible:
        wumpus_eligible = other_cells
    wumpus_cell = random.choice(wumpus_eligible)
    
    kb = KnowledgeBase()
    kb.tell_safe(0, 0)
    
    return {
        'rows': rows,
        'cols': cols,
        'pits': pit_cells,
        'wumpus': wumpus_cell,
        'agent': [0, 0],
        'visited': [[0, 0]],
        'safe_cells': [[0, 0]],
        'frontier': [],
        'kb': kb,
        'game_over': False,
        'won': False,
        'dead': False,
        'message': f'World created: {rows}x{cols} with {len(pit_cells)} pits',
        'score': 0,
        'steps_taken': 0,
        'last_percepts': [],
        'cell_status': {}
    }


def get_percepts(state, x, y):
    """Get percepts at cell (x, y)."""
    percepts = []
    rows, cols = state['rows'], state['cols']
    pits = [tuple(p) for p in state['pits']]
    wumpus = tuple(state['wumpus'])
    
    neighbors = get_neighbors(x, y, rows, cols)
    
    if any(n in pits for n in neighbors):
        percepts.append('BREEZE')
    if any(n == wumpus for n in neighbors):
        percepts.append('STENCH')
    
    return percepts


def update_kb(state, x, y, percepts):
    """TELL the KB what the agent perceives."""
    kb = state['kb']
    rows, cols = state['rows'], state['cols']
    
    kb.tell_safe(x, y)
    
    if 'BREEZE' in percepts:
        kb.tell_breeze(x, y, rows, cols)
    else:
        kb.tell_no_breeze(x, y, rows, cols)
    
    if 'STENCH' in percepts:
        kb.tell_stench(x, y, rows, cols)
    else:
        kb.tell_no_stench(x, y, rows, cols)


def choose_next_move(state):
    """Agent decision logic using KB."""
    kb = state['kb']
    rows, cols = state['rows'], state['cols']
    visited = set(map(tuple, state['visited']))
    
    frontier = set()
    for vx, vy in visited:
        for nx, ny in get_neighbors(vx, vy, rows, cols):
            if (nx, ny) not in visited:
                frontier.add((nx, ny))
    
    state['frontier'] = [list(c) for c in frontier]
    
    if not frontier:
        return None, 'complete'
    
    safe_moves = []
    for fx, fy in frontier:
        if kb.ask_safe(fx, fy):
            safe_moves.append((fx, fy))
            state['cell_status'][f'{fx},{fy}'] = 'safe'
    
    if safe_moves:
        ax, ay = state['agent']
        safe_moves.sort(key=lambda c: abs(c[0]-ax) + abs(c[1]-ay))
        return safe_moves[0], 'safe_proven'
    
    if frontier:
        ax, ay = state['agent']
        frontier_list = list(frontier)
        frontier_list.sort(key=lambda c: abs(c[0]-ax) + abs(c[1]-ay))
        return frontier_list[0], 'unknown_risk'
    
    return None, 'no_frontier'


def step_agent(state):
    """Perform one agent step with POSITIVE SCORING from 0."""
    if state['game_over']:
        return state

    ax, ay = state['agent']
    percepts = get_percepts(state, ax, ay)
    state['last_percepts'] = percepts
    
    pits = [tuple(p) for p in state['pits']]
    wumpus = tuple(state['wumpus'])
    
    if (ax, ay) in pits or (ax, ay) == wumpus:
        state['game_over'] = True
        state['dead'] = True
        state['score'] -= 50
        if (ax, ay) in pits:
            state['message'] = f'Agent fell into a pit at ({ax},{ay})! Final Score: {state["score"]}'
        else:
            state['message'] = f'Agent was eaten by the Wumpus at ({ax},{ay})! Final Score: {state["score"]}'
        return state
    
    if [ax, ay] not in state['visited']:
        state['visited'].append([ax, ay])
        state['score'] += 25
    
    update_kb(state, ax, ay, percepts)
    next_cell, reason = choose_next_move(state)
    
    state['steps_taken'] += 1
    state['score'] += 10
    
    if next_cell is None:
        state['won'] = True
        state['game_over'] = True
        state['score'] += 200
        state['message'] = f'VICTORY! Explored {len(state["visited"])} cells! Final Score: {state["score"]}'
        return state
    
    nx, ny = next_cell
    old_agent = state['agent']
    state['agent'] = [nx, ny]
    
    if reason == 'safe_proven':
        state['score'] += 15
    
    if reason == 'unknown_risk':
        state['score'] += 5
    
    percept_str = ', '.join(percepts) if percepts else 'none'
    state['message'] = f'Moved ({old_agent[0]},{old_agent[1]}) to ({nx},{ny}) | Percepts: {percept_str} | Score: {state["score"]}'
    
    total_safe_cells = state['rows'] * state['cols'] - len(state['pits'])
    if len(state['visited']) >= total_safe_cells:
        state['won'] = True
        state['game_over'] = True
        state['score'] += 200
        state['message'] = f'VICTORY! Explored {len(state["visited"])} safe cells! Final Score: {state["score"]}'
    
    return state


def serialize_state(state):
    """Convert state to JSON-serializable dict."""
    kb = state['kb']
    pits = [tuple(p) for p in state['pits']]
    wumpus = tuple(state['wumpus'])
    rows, cols = state['rows'], state['cols']
    
    grid = []
    visited_set = set(map(tuple, state['visited']))
    frontier_set = set(map(tuple, state.get('frontier', [])))
    
    for r in range(rows):
        row = []
        for c in range(cols):
            is_visited = (r, c) in visited_set
            is_frontier = (r, c) in frontier_set and not is_visited
            percepts = get_percepts(state, r, c) if is_visited else []
            
            cell = {
                'row': r,
                'col': c,
                'visited': is_visited,
                'is_agent': state['agent'] == [r, c],
                'is_pit': (r, c) in pits,
                'is_wumpus': (r, c) == wumpus,
                'in_frontier': is_frontier,
                'kb_safe': state['cell_status'].get(f'{r},{c}') == 'safe',
                'percepts': percepts,
            }
            row.append(cell)
        grid.append(row)
    
    return {
        'grid': grid,
        'rows': rows,
        'cols': cols,
        'agent': state['agent'],
        'visited_count': len(state['visited']),
        'game_over': state['game_over'],
        'won': state['won'],
        'dead': state['dead'],
        'message': state['message'],
        'score': state['score'],
        'steps_taken': state['steps_taken'],
        'last_percepts': state['last_percepts'],
        'kb_clauses': kb.clause_count(),
        'resolution_calls': kb.resolution_calls,
        'resolution_steps': kb.resolution_steps,
        'inference_steps': kb.inference_steps,
    }


# ─── Flask Routes ──────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/new', methods=['POST'])
def new_episode():
    """Initialize a new world."""
    global world_state
    try:
        data = request.get_json()
        
        rows = max(2, min(6, int(data.get('rows', 4))))
        cols = max(2, min(6, int(data.get('cols', 4))))
        num_pits = max(1, min(rows * cols // 3, int(data.get('pits', 3))))
        
        world_state = init_world(rows, cols, num_pits)
        
        return jsonify(serialize_state(world_state))
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/step', methods=['POST'])
def step():
    """Perform one agent step."""
    global world_state
    if not world_state:
        return jsonify({'error': 'No world initialized. Click New Episode first.'}), 400
    
    try:
        world_state = step_agent(world_state)
        return jsonify(serialize_state(world_state))
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/state', methods=['GET'])
def get_state():
    """Get current state."""
    if not world_state:
        return jsonify({'error': 'No world initialized'}), 400
    
    try:
        return jsonify(serialize_state(world_state))
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("Starting Wumpus World Server...")
    print("Open http://localhost:5000 in your browser")
    app.run(debug=True, port=5000)
