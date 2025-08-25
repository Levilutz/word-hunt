use std::collections::{HashMap, HashSet};

/// A single node in a word tree, identifying a single traversible letter
#[derive(Debug, Clone)]
struct WordTreeNode {
    /// The ID of this node (index in nodes array)
    id: usize,

    /// The letter contained in this node
    val: u8,

    /// Whether this node terminates a valid word
    terminus: bool,

    /// A map of the next nodes, identified by their contained value
    next: HashMap<u8, usize>,
}

/// A tree of valid dictionary words.
#[derive(Debug, Clone, Default)]
struct WordTree {
    /// The node IDs of each initial letter
    head_ids: HashMap<u8, usize>,

    /// All the nodes in the tree, stored flat
    nodes: Vec<WordTreeNode>,
}

impl WordTree {
    /// Add a node node to the tree, return its id
    fn add_node(&mut self, val: u8, terminus: bool) -> usize {
        let id = self.nodes.len();
        self.nodes.push(WordTreeNode {
            id,
            val,
            terminus,
            next: HashMap::new(),
        });
        return id;
    }

    /// Ensure a head node for the given char exists, return its id
    fn ensure_head(&mut self, chr: u8, terminus: bool) -> usize {
        if let Some(head_id) = self.head_ids.get(&chr) {
            return *head_id;
        }
        let id = self.add_node(chr, terminus);
        self.head_ids.insert(chr, id);
        id
    }

    /// Ensure a child for the given node exists, return its id
    fn ensure_child(&mut self, node_id: usize, val: u8, terminus: bool) -> usize {
        if let Some(child_id) = self.nodes[node_id].next.get(&val) {
            return *child_id;
        }
        let child_id = self.add_node(val, terminus);
        self.nodes[node_id].next.insert(val, child_id);
        child_id
    }

    /// Add a new word to the dictionary
    fn add_word(&mut self, word: &[u8]) {
        if word.len() == 0 {
            return;
        }
        let mut cur_id = self.ensure_head(word[0], word.len() == 1);
        for (i, chr) in word[1..].iter().enumerate() {
            cur_id = self.ensure_child(cur_id, *chr, i == word.len() - 2);
        }
    }

    fn list_words_inner(&self, node_id: usize, prefix: &[u8]) -> Vec<Vec<u8>> {
        let node = &self.nodes[node_id];
        let new_prefix = append_char(prefix, node.val);

        let mut out = vec![];
        if node.terminus {
            out.push(new_prefix.clone());
        }
        for (_, child_id) in &self.nodes[node_id].next {
            out.append(&mut self.list_words_inner(*child_id, &new_prefix));
        }
        out
    }

    /// Get all words in the dictionary
    fn list_words(&self) -> Vec<Vec<u8>> {
        let mut out = vec![];
        for (_, head_id) in &self.head_ids {
            out.append(&mut self.list_words_inner(*head_id, &vec![]))
        }
        out
    }
}

/// A node in the char graph, representing a single grid tile.
#[derive(Debug, Clone, Default)]
struct CharGraphNode {
    /// The ID of this node (index in the nodes array)
    id: usize,

    /// The letter contained in this node
    val: u8,

    /// The (y, x) coordinates of this tile (only useful to consumer)
    coords: (usize, usize),

    /// A map of the next nodes, identified by their contained value
    next: HashMap<u8, HashSet<usize>>,
}

/// An undirected dense graph of characters, representing the grid.
#[derive(Debug, Clone, Default)]
struct CharGraph {
    nodes: Vec<CharGraphNode>,

    /// Given row ind and col ind, get node id
    nodes_by_coord: HashMap<usize, HashMap<usize, usize>>,
}

impl CharGraph {
    /// Add a node to the graph, return its id.
    fn add_node(&mut self, val: u8, coords: (usize, usize)) -> usize {
        let id = self.nodes.len();
        self.nodes.push(CharGraphNode {
            id,
            val,
            coords,
            next: HashMap::new(),
        });
        let existed = self
            .nodes_by_coord
            .entry(coords.0)
            .or_default()
            .insert(coords.1, id)
            .is_some();
        if existed {
            panic!("Duplicate insert of coordinates {:?}", coords);
        }
        id
    }

    /// Add an undirected edge between two nodes. No-op if edge already exixsts.
    fn add_edge(&mut self, node_id_a: usize, node_id_b: usize) {
        let val_a = self.nodes[node_id_a].val;
        let val_b = self.nodes[node_id_b].val;
        self.nodes[node_id_a]
            .next
            .entry(val_b)
            .or_default()
            .insert(node_id_b);
        self.nodes[node_id_b]
            .next
            .entry(val_a)
            .or_default()
            .insert(node_id_a);
    }

    /// Build a char graph for a simple 4x4 grid.
    fn from_simple_grid(chars: &[[u8; 4]; 4]) -> Self {
        let mut graph = Self::default();
        for y in 0..4 {
            for x in 0..4 {
                graph.add_node(chars[y][x], (y, x));
            }
        }
        for y in 0..4i8 {
            for x in 0..4i8 {
                for dy in -1..=1i8 {
                    for dx in -1..=1i8 {
                        if dy == 0 && dx == 0 {
                            continue;
                        }
                        let neighbor_y = y + dy;
                        let neighbor_x = x + dx;
                        if neighbor_y < 0 || neighbor_y >= 4 || neighbor_x < 0 || neighbor_x >= 4 {
                            continue;
                        }
                        let node_id = graph.nodes_by_coord[&(y as usize)][&(x as usize)];
                        let neighbor_id =
                            graph.nodes_by_coord[&(neighbor_y as usize)][&(neighbor_x as usize)];
                        graph.add_edge(node_id, neighbor_id);
                    }
                }
            }
        }
        graph
    }
}

fn append_char(word: &[u8], chr: u8) -> Vec<u8> {
    let mut out = word.to_vec();
    out.push(chr);
    out
}

fn word_from_str(raw: &str) -> Vec<u8> {
    raw.chars()
        .map(|byte| byte.to_ascii_uppercase() as u8 - 65)
        .collect()
}

fn words_from_strs(raws: &[&str]) -> Vec<Vec<u8>> {
    raws.iter().map(|word| word_from_str(word)).collect()
}

fn word_to_str(word: &[u8]) -> String {
    word.iter().map(|chr| (b'a' + chr) as char).collect()
}

fn words_to_strs(words: &[Vec<u8>]) -> Vec<String> {
    words.iter().map(|word| word_to_str(&word)).collect()
}

#[cfg(test)]
mod tests {
    use std::collections::HashSet;

    use super::*;

    fn to_owned(words: &[&str]) -> Vec<String> {
        words.iter().map(|word| word.to_string()).collect()
    }

    #[test]
    fn test_word_tree() {
        let words = to_owned(&["foo", "bar", "baz", "foooz", "barz", "buz"]);
        let mut tree = WordTree::default();
        for word in &words {
            tree.add_word(&word_from_str(word));
        }
        let tree_words = words_to_strs(&tree.list_words());
        let expected: HashSet<String> = words.into_iter().collect();
        let actual: HashSet<String> = tree_words.into_iter().collect();
        assert_eq!(expected, actual);
    }

    #[test]
    fn test_char_graph_grid_num_neighbors() {
        let graph = CharGraph::from_simple_grid(&[
            [0, 1, 2, 3],
            [4, 5, 6, 7],
            [8, 9, 10, 11],
            [12, 13, 14, 15],
        ]);
        for y in 0..4 {
            for x in 0..4 {
                let y_edge = y == 0 || y == 3;
                let x_edge = x == 0 || x == 3;
                let node_id = graph.nodes_by_coord[&y][&x];
                let num_neighbors: usize = graph.nodes[node_id]
                    .next
                    .values()
                    .map(|set| set.len())
                    .sum();
                if y_edge && x_edge {
                    assert_eq!(num_neighbors, 3);
                } else if y_edge || x_edge {
                    assert_eq!(num_neighbors, 5);
                } else {
                    assert_eq!(num_neighbors, 8);
                }
            }
        }
    }
}
