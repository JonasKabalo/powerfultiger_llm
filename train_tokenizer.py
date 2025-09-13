from tokenizers import ByteLevelBPETokenizer
import argparse, os

parser = argparse.ArgumentParser()
parser.add_argument("--input_dir", type=str, required=True)
parser.add_argument("--vocab_size", type=int, default=32000)
parser.add_argument("--output_dir", type=str, default="./tokenizer")
args = parser.parse_args()

os.makedirs(args.output_dir, exist_ok=True)
files = [os.path.join(args.input_dir, f) for f in os.listdir(args.input_dir) if f.endswith(".txt")]

if not files:
    raise SystemExit("No .txt files found")

tokenizer = ByteLevelBPETokenizer()
tokenizer.train(files=files, vocab_size=args.vocab_size, min_frequency=2, special_tokens=["<s>","<pad>","</s>","<unk>","<mask>"])
tokenizer.save_model(args.output_dir)
print("Tokenizer saved to", args.output_dir)