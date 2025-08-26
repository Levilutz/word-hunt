use std::fmt::{Debug, Display};

/// A simpler representation of a word so we don't have to worry abt unicode etc.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Word(Vec<u8>);

impl Word {
    /// Produce an empty word.
    pub fn empty() -> Self {
        Self(vec![])
    }

    /// Produce a word from a raw string, case-insensitive.
    pub fn from_str(raw: &str) -> Self {
        Self(
            raw.chars()
                .map(|chr| chr.to_ascii_uppercase() as u8 - 65)
                .collect(),
        )
    }

    /// Produce a vec of words from a list of raw strings, case-insensitive.
    pub fn from_strs(raws: &[&str]) -> Vec<Self> {
        raws.iter().map(|raw| Self::from_str(raw)).collect()
    }

    /// Produce a new word that's a copy of this one, with the given character added.
    pub fn with_char(&self, chr: u8) -> Self {
        let mut new_word = self.0.clone();
        new_word.push(chr);
        Self(new_word)
    }

    /// Get the length of this word, in characters.
    pub fn len(&self) -> usize {
        self.0.len()
    }

    /// Get a reference to the characters contained in this word.
    pub fn chars(&self) -> &[u8] {
        &self.0
    }
}

impl Display for Word {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        for chr in &self.0 {
            write!(f, "{}", (b'A' + chr) as char)?;
        }
        Ok(())
    }
}

impl Debug for Word {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Word({})", self)
    }
}
