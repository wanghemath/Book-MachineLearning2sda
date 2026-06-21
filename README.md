# Modern Time Series Analysis and Sequence Learning

**Classical Theory, Forecasting, Spectral Methods, Deep Learning, and AI-Assisted Modeling**

This repository contains a Quarto e-book for the time-series and sequence-data part of an advanced machine learning course. The book is designed for mathematically trained graduate students who want to understand both classical time series analysis and modern sequence learning methods.

The project includes textbook-style chapters, interactive Plotly examples, independent-study Python labs, forecasting projects, and a practical Python reference.

## Repository

- GitHub repository: <https://github.com/wanghemath/Book-MachineLearning2sda>
- Expected GitHub Pages site: <https://wanghemath.github.io/Book-MachineLearning2sda/>
- Author: He Wang

## What this book covers

The book is organized into seven parts.

1. **Time Series as Dependent Data**
   - Why time series and sequences are different from ordinary tabular data
   - Exploratory data analysis for trend, seasonality, dependence, and anomalies

2. **Stationarity and Linear Time-Domain Models**
   - Stationarity, autocovariance, and autocorrelation
   - Linear processes, AR, MA, and ARMA models
   - Difference equations and dynamic behavior
   - Best linear prediction and forecasting
   - Estimation, identification, and diagnostics

3. **Nonstationary and Seasonal Models**
   - ARIMA and differencing
   - SARIMA and multiple seasonality
   - State-space models and Kalman filtering
   - Hidden Markov models and regime switching

4. **Frequency-Domain and Multiresolution Methods**
   - Spectral analysis
   - DFT, FFT, and periodograms
   - Filtering and wavelets

5. **Forecasting at Scale and Machine Learning Methods**
   - Forecast evaluation and backtesting
   - Automated forecasting and Prophet-style modeling
   - Feature-based machine learning for time series
   - Probabilistic forecasting and uncertainty quantification

6. **Deep Learning for Time Series and Sequence Data**
   - Neural networks for time series
   - Convolutional models and temporal convolutional networks
   - RNN, LSTM, and GRU models
   - Attention and Transformers for time series
   - Representation learning for time series
   - Multivariate, panel, and hierarchical forecasting

7. **Responsible AI, Projects, and Deployment**
   - AI-assisted time series modeling
   - End-to-end forecasting pipelines
   - Final project studio

## Main files and folders

```text
.
├── _quarto.yml                 # Quarto book configuration
├── index.qmd                   # Book landing page
├── introduction.qmd            # Course/book introduction
├── chapters/                   # 27 main chapter files
├── labs/                       # 27 Python independent-study notebooks
├── assets/                     # CSS, JavaScript, and global HTML header
├── data/                       # Small synthetic datasets used by examples
├── labs-summary.qmd            # Summary of all labs with Colab links
├── interactive-htmls.qmd       # Summary of interactive HTML modules
├── final-projects.qmd          # Project guide and project ideas
├── python-reference.qmd        # Practical Python reference
├── references.bib              # Bibliography
├── references.qmd              # References page
├── requirements.txt            # Python package requirements
└── environment.yml             # Conda environment file
```

## Python labs

Each chapter has a companion independent-study notebook in the `labs/` folder. The labs are designed for students to work through on their own, so they include background explanation before programming.

The Colab link pattern is:

```text
https://colab.research.google.com/github/wanghemath/Book-MachineLearning2sda/blob/main/labs/<lab-filename>.ipynb
```

For example:

```text
https://colab.research.google.com/github/wanghemath/Book-MachineLearning2sda/blob/main/labs/chapter-01-why-time-series-and-sequences-lab.ipynb
```

Labs 19--23 use TensorFlow/Keras and are intended to run in Google Colab or another environment with TensorFlow installed.

## Build the book locally

Install Quarto first:

<https://quarto.org/docs/get-started/>

Then clone the repository and preview the book.

```bash
git clone https://github.com/wanghemath/Book-MachineLearning2sda.git
cd Book-MachineLearning2sda
quarto preview
```

To render the full site:

```bash
quarto render
```

The rendered site will be written to the `docs/` folder, as specified in `_quarto.yml`.

## Python environment

Using `pip`:

```bash
python -m venv .venv
source .venv/bin/activate   # macOS/Linux
# .venv\Scripts\activate    # Windows PowerShell
pip install -r requirements.txt
```

Using `conda`:

```bash
conda env create -f environment.yml
conda activate modern-ts-sequence
```

## Interactive examples

The HTML book uses interactive Plotly examples. Plotly is loaded once globally through `assets/header.html`, and chapter pages use the shared JavaScript file `assets/ts-interactives.js`.

Important maintenance rule:

```text
Do not add another Plotly CDN script inside individual chapter .qmd files.
```

This avoids duplicate loading, path errors, and inconsistent interactive behavior across chapters.

## Suggested workflow for editing

1. Edit the relevant `.qmd` file in `chapters/`.
2. Edit or add notebook material in `labs/`.
3. Preview locally with `quarto preview`.
4. Render with `quarto render` before committing.
5. Check that interactive examples still work in the HTML output.
6. Check that Colab links point to the `main` branch of this repository.

## Notes for lab maintenance

- Keep labs self-contained and student-friendly.
- Avoid data leakage in forecasting examples.
- Use chronological train/test splits, not random splits, unless the goal is to demonstrate why random splits are problematic.
- Use `$...$` and `$$...$$` for mathematical notation in notebooks and Quarto files.
- Avoid LaTeX commands that display poorly in Google Colab notebooks.
- Keep TensorFlow labs Colab-friendly.

## License and reuse

This repository is intended for instructional use. Add a `LICENSE` file if the course materials will be publicly distributed under a specific open-source or open-education license.

## Citation

For course use, cite as:

```text
Wang, H. Modern Time Series Analysis and Sequence Learning: Classical Theory, Forecasting, Spectral Methods, Deep Learning, and AI-Assisted Modeling. Quarto e-book, 2026.
```
