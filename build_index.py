import os, argparse, faiss
from sentence_transformers import SentenceTransformer

parser = argparse.ArgumentParser()
parser.add_argument("--docs_dir", type=str, default="./docs")
parser.add_argument("--index_file", type=str, default="./data/index.faiss")
args = parser.parse_args()

embedder = SentenceTransformer("all-MiniLM-L6-v2")
texts, ids = [], []
for fn in os.listdir(args.docs_dir):
    if fn.endswith(".txt"):
        with open(os.path.join(args.docs_dir, fn)) as f:
            for line in f:
                line=line.strip()
                if line:
                    texts.append(line)
                    ids.append(fn)

embeddings = embedder.encode(texts, convert_to_numpy=True, show_progress_bar=True)
index = faiss.IndexFlatL2(embeddings.shape[1])
index.add(embeddings)
faiss.write_index(index, args.index_file)

with open(args.index_file+".meta","w") as f:
    for t,i in zip(texts,ids):
        f.write(f"{i}\t{t}\n")
print("Index built and saved.")