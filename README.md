# Modern Time Series Analysis and Sequence Learning

This is a Quarto e-book package for the time-series and sequence-data part of an advanced machine learning theory course.

## Build

```bash
quarto preview
# or
quarto render
```

## Important Plotly rule

Plotly.js is loaded once in `assets/header.html`:

```html
<script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
```

Do not include Plotly.js again in individual chapter files.

## Structure

- `_quarto.yml`: Quarto book configuration.
- `index.qmd`, `introduction.qmd`: front matter.
- `chapters/`: 27 chapter files.
- `labs/`: companion Python lab notebooks.
- `assets/`: CSS, global header, and JavaScript interactions.
- `references.bib`: starter bibliography.

## Python setup

```bash
pip install -r requirements.txt
```

or

```bash
conda env create -f environment.yml
conda activate modern-ts-sequence
```
