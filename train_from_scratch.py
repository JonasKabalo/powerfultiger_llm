# train_from_scratch.py
import argparse
from pathlib import Path
from datasets import load_dataset
from transformers import (
    GPT2Config,
    GPT2LMHeadModel,
    GPT2TokenizerFast,
    Trainer,
    TrainingArguments,
    DataCollatorForLanguageModeling
)
import torch

def group_texts(examples, block_size=128):
    # Concatenate all texts
    concatenated = sum(examples['input_ids'], [])
    total_length = len(concatenated)
    # Drop the remainder if not divisible by block_size
    total_length = (total_length // block_size) * block_size
    result = {
        "input_ids": [concatenated[i:i+block_size] for i in range(0, total_length, block_size)],
        "labels": [concatenated[i:i+block_size] for i in range(0, total_length, block_size)]
    }
    return result

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--tokenizer_dir", type=str, required=True)
    parser.add_argument("--data_file", type=str, required=True)
    parser.add_argument("--output_dir", type=str, required=True)
    parser.add_argument("--num_train_epochs", type=int, default=3)
    parser.add_argument("--per_device_train_batch_size", type=int, default=2)
    parser.add_argument("--block_size", type=int, default=128)
    parser.add_argument("--learning_rate", type=float, default=1e-4)
    args = parser.parse_args()

    # Device
    device = torch.device("mps") if torch.backends.mps.is_available() else torch.device("cpu")

    # Load tokenizer
    tokenizer = GPT2TokenizerFast.from_pretrained(args.tokenizer_dir)
    tokenizer.pad_token = tokenizer.eos_token  # Make sure padding token exists

    # Load dataset
    dataset = load_dataset("text", data_files={"train": args.data_file})
    dataset = dataset.map(lambda x: tokenizer(x["text"]), batched=True, remove_columns=["text"])

    # Group texts into blocks
    lm_dataset = dataset.map(
    lambda x: group_texts(x, args.block_size),
    batched=True,
    remove_columns=dataset["train"].column_names)

    # Model config
    config = GPT2Config(
        vocab_size=len(tokenizer),
        n_positions=args.block_size,
        n_ctx=args.block_size,
        n_embd=256,   # small for testing
        n_layer=4,
        n_head=4,
        pad_token_id=tokenizer.pad_token_id
    )
    model = GPT2LMHeadModel(config)
    model.resize_token_embeddings(len(tokenizer))
    model.to(device)

    # Data collator
    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer, mlm=False, pad_to_multiple_of=None
    )

    # Training arguments
    training_args = TrainingArguments(
        output_dir=args.output_dir,
        overwrite_output_dir=True,
        num_train_epochs=args.num_train_epochs,
        per_device_train_batch_size=args.per_device_train_batch_size,
        save_steps=500,
        save_total_limit=2,
        logging_steps=50,
        learning_rate=args.learning_rate,
        weight_decay=0.01,
        prediction_loss_only=True,
        report_to="none",
        fp16=False,  # MPS often has issues with mixed precision
    )

    # Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=lm_dataset["train"],
        tokenizer=tokenizer,
        data_collator=data_collator
    )

    # Train
    trainer.train()

    # Save model and tokenizer together
    model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)
    print(f"Model and tokenizer saved to {args.output_dir}")

if __name__ == "__main__":
    main()
