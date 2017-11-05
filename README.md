# Instacart Basket Data - Alexis Facques

Data Mining & Visualisation (DMV) - Project
Master Cloud Computing & Services - Université de Rennes 1

Exploring and mining basic information from an anonymised retail transactions dataset given by the company Instacart, mainly using **TypeScript** and **NodeJS**.

Mining frequent, sequential and discriminative patterns using the open-source data mining mining library [SPMF](http://www.philippe-fournier-viger.com/spmf/)

Results are presented through a runnable Jupyter Notebook.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

- Download and unzip the dataset files from [Instacart's website](https://www.instacart.com/datasets/grocery-shopping-2017); Smaller (for display purposes only) and custom files (preformatted datasets) are already provided.

- Clone this repo, build the docker image:

`docker build --tag instacart .`

- Run the image mounting the folder to the dataset files as such:

`docker run -v <PATH TO YOUR FOLDER>:/usr/src/app/instacart_basket_data -p 9999:9999 instacart`

- Jupyter Notebook Server is available on `http//localhost:9999`. Default password to the notebook is `dmv`. You may have to rerun the notebook in order to see the graphs (or at list, dependency loader + graph cells).

## License

This project is licensed under the MIT License.
