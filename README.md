````markdown
# PowerfulTiger: Tiny LLM with RAG

PowerfulTiger is a lightweight framework

* If loss shows `nan` initially (especially on Apple M-series GPUs), it's normal and will stabilize.
* `NotOpenSSLWarning` is harmless on macOS.
* Recommended: small batch size (1-2) and learning rate \~5e-4 for tiny models.
* For higher quality responses with very small models, try `chat_rag_simple.py` which uses pattern matching for coherent answers.ing (**Step 6**) and your LLM will respond consistently in-character.

---

## 📊 System Architecture

```
┌────────────┐     ┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│  Documents │────>│  Tokenizer  │────>│  LLM Model   │────>│  RAG Chatbot   │
│  (./docs/) │     │ (BPE-based) │     │ (GPT2-style) │     │  (Q&A system)  │
└────────────┘     └─────────────┘     └──────────────┘     └────────────────┘
      │                                        │                    ↑
      │                                        │                    │
      └────────────────────────────>┌──────────────────┐           │
                                    │  FAISS Index     │───────────┘
                                    │  (Vector store)  │
                                    └──────────────────┘
```

## ⚙️ Performance Expectations

- **Model Size**: This is a tiny model (typically under 100MB) designed for educational purposes and lightweight applications
- **Context Window**: Limited to 128 tokens by default (configurable but affects memory usage)
- **Response Quality**: Coherent but basic responses; quality improves with more training data
- **Speed**: Fast inference even on CPU (no need for GPU at inference time)
- **Limitations**: Cannot match capabilities of large commercial models; limited world knowledge unless provided in documents

---

### **2️⃣ How to try the LLM now**unning small language models (LLMs) with retrieval-augmented generation (RAG). This project allows you to create your own custom AI assistant with a unique persona that can leverage external knowledge to provide better responses.

## 🖥️ Prerequisites
- Python 3.8 or higher
- At least 4GB RAM (8GB+ recommended)
- GPU optional but recommended for faster training
- macOS, Linux, or Windows

## 🚀 Train & Run Your Own Tiny LLM with RAG

### 1. Install dependencies
```bash
python -m venv venv && source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
````

### 2. Prepare docs

* Place your `.txt` files into `./docs/`.
  Example: `persona.txt` with your LLM persona, plus any domain-specific text.
* Run:

```bash
bash prepare_data.sh
```

> ⚠️ **Important:** Any time you add or modify files in `./docs/`, you **must retrain the LLM** to take them into account.

### 3. Train tokenizer

```bash
python train_tokenizer.py --input_dir ./docs --vocab_size 16000 --output_dir ./tokenizer
```

### 4. Train model from scratch

```bash
python train_from_scratch.py --tokenizer_dir ./tokenizer --data_file ./data/all_docs.txt \
    --output_dir ./model_from_scratch --num_train_epochs 6 --per_device_train_batch_size 2 --block_size 128
```

* The script now automatically handles issues with column lengths during mapping.
* After training, the tokenizer’s `vocab.json` and `merges.txt` are copied into `./model_from_scratch/`.
* **If you change `docs/`** or your persona, **re-run this step** to retrain the model with updated data.

### 5. Build FAISS index for docs

```bash
python build_index.py --docs_dir ./docs --index_file ./data/index.faiss
```

### 6. Run RAG chat REPL

```bash
python chat_rag.py --model_dir ./model_from_scratch --index_file ./data/index.faiss --docs_dir ./docs
```

* The chat script now prepends retrieved documents to your prompt.
* ⚠️ The script automatically resizes token embeddings to match the tokenizer.
* Prompts + retrieved docs are truncated to the model’s maximum positional embedding length to prevent crashes.

### 7. Notes / Tips

* If loss shows `nan` initially (especially on Apple M-series GPUs), it’s normal and will stabilize.
* `NotOpenSSLWarning` is harmless on macOS.
* Recommended: small batch size (1-2) and learning rate \~5e-4 for tiny models.

---

### **💡 How to customize your LLM persona**

1. Edit or create a `.txt` file in `./docs/` (e.g., `persona.txt`):

```
I am a friendly AI assistant who loves helping humans with their questions.
I am 25 years old and enjoy reading classic literature.
I speak politely and try to explain things clearly.
```

2. Retrain the model using **Step 4**.
3. Build the FAISS index again (**Step 5**).
4. Start chatting (**Step 6**) and your LLM will respond consistently in-character.

---

### **2️⃣ How to try the LLM now**

```bash
python chat_rag.py --model_dir ./model_from_scratch --index_file ./data/index.faiss --docs_dir ./docs
```

* Enter your prompts interactively.
* The model will use both your persona and retrieved documents to generate answers.

For models with very limited context windows (128 tokens), you can also try the simplified chat script:

```bash
python chat_rag_simple.py --model_dir ./model_from_scratch --docs_dir ./docs
```

This uses pattern matching instead of generation for more coherent responses with small models.
