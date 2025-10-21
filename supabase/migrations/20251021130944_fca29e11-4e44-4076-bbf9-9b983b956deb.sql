-- Create user_memory table to store persistent context about users
CREATE TABLE user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL, -- 'person', 'place', 'event', 'theme', 'goal', 'habit'
  entity_name TEXT NOT NULL, -- e.g., "Sarah", "work project", "mom"
  context JSONB NOT NULL, -- Rich context about this entity
  first_mentioned_at TIMESTAMPTZ NOT NULL,
  last_mentioned_at TIMESTAMPTZ NOT NULL,
  mention_count INTEGER DEFAULT 1,
  sentiment_distribution JSONB DEFAULT '{"positive": 0, "neutral": 0, "negative": 0}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_memory_user_id ON user_memory(user_id);
CREATE INDEX idx_user_memory_type ON user_memory(memory_type);
CREATE INDEX idx_user_memory_name ON user_memory(entity_name);

-- Create thought_entities table to link thoughts to recognized entities
CREATE TABLE thought_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
  memory_id UUID NOT NULL REFERENCES user_memory(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_thought_entities_thought ON thought_entities(thought_id);
CREATE INDEX idx_thought_entities_memory ON thought_entities(memory_id);

-- Enable Row Level Security
ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE thought_entities ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_memory
CREATE POLICY "Users can view their own memories"
ON user_memory
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memories"
ON user_memory
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories"
ON user_memory
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories"
ON user_memory
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for thought_entities
CREATE POLICY "Users can view their own thought entities"
ON thought_entities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM thoughts
    WHERE thoughts.id = thought_entities.thought_id
    AND thoughts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own thought entities"
ON thought_entities
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM thoughts
    WHERE thoughts.id = thought_entities.thought_id
    AND thoughts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own thought entities"
ON thought_entities
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM thoughts
    WHERE thoughts.id = thought_entities.thought_id
    AND thoughts.user_id = auth.uid()
  )
);

-- Add trigger for updating updated_at on user_memory
CREATE TRIGGER update_user_memory_updated_at
BEFORE UPDATE ON user_memory
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();