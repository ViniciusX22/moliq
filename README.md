# moliq
API for getting a chemical reaction result based on an input formula.

## Usage
Pass the formula as the query string and it will show the result, or a message if no reaction is possible with given elements.

```
https://moliq.vercel.app/?q=H2O+O2
```

## Stack
It uses Express.js for serving the API and OpenAI for getting the reaction results.
