use std::collections::HashMap;

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
}
