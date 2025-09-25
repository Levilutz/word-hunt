interface TrieNode {
  /** The id of this node (index in nodes array). */
  id: number;

  /** The id of this node's parent, or `null` if a root. */
  parentId: number | null;

  /** The contained character in this node. */
  val: string;

  /** Whether this node represents the end of a word. */
  terminus: boolean;

  /** A map from character to node id, for all the children of this node. */
  next: Map<string, number>;
}

export class Trie {
  private heads: Map<string, number> = new Map();
  private nodes: TrieNode[] = [];

  /** Construct a new Trie from a list of words. */
  constructor(words: string[]) {
    for (const word of words) {
      this.addWord(word);
    }
  }

  /** Check whether the trie contains the given word. */
  containsWord(word: string): boolean {
    if (word.length === 0) {
      return false;
    }
    let cur_node_id = this.heads.get(word[0]);
    for (const val of word.slice(1)) {
      if (cur_node_id === undefined) {
        break;
      }
      cur_node_id = this.nodes[cur_node_id].next.get(val);
    }
    return cur_node_id !== undefined && this.nodes[cur_node_id].terminus;
  }

  /** Add a new node to the trie, return its id. */
  private addNode(
    parentId: number | null,
    val: string,
    terminus: boolean,
  ): number {
    const id = this.nodes.length;
    this.nodes.push({
      id,
      parentId,
      val,
      terminus,
      next: new Map(),
    });
    return id;
  }

  /** Ensure a head node for the given character exists, return its id. */
  private ensureHead(val: string, terminus: boolean): number {
    let id = this.heads.get(val);
    if (id !== undefined) {
      if (terminus) {
        this.nodes[id].terminus = true;
      }
      return id;
    }
    id = this.addNode(null, val, terminus);
    this.heads.set(val, id);
    return id;
  }

  /** Ensure a child for the given node exists, return its id. */
  private ensureChild(nodeId: number, val: string, terminus: boolean): number {
    let id = this.nodes[nodeId].next.get(val);
    if (id !== undefined) {
      if (terminus) {
        this.nodes[id].terminus = true;
      }
      return id;
    }
    id = this.addNode(nodeId, val, terminus);
    this.nodes[nodeId].next.set(val, id);
    return id;
  }

  /** Add a new word to the trie. */
  private addWord(word: string) {
    if (word.length === 0) {
      return;
    }
    let curNodeId = this.ensureHead(word[0], word.length === 1);
    for (const [ind, val] of word.slice(1).split("").entries()) {
      curNodeId = this.ensureChild(curNodeId, val, ind === word.length - 2);
    }
  }
}
