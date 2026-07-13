"""
Orchestration script – runs the entire pipeline.
"""

from src.train import train_pipeline

if __name__ == "__main__":
    # You can optionally pass a data source here, otherwise it uses config.yaml
    train_pipeline()