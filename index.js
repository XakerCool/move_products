const express = require('express');
const bodyParser = require('body-parser');
const timeout = require("connect-timeout");
const cors = require("cors");
const dotenv = require('dotenv');
const path = require("path");
const fs = require('fs');

const {logError, logSuccess} = require("./logger/logger");
const {DealProcessor} = require("./dealProcessor");
const {StoreProcessor} = require("./storeProcessor");

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const PORT = 1118;
const app = express();

const link = process.env.BX_LINK;

app.use(cors({
    origin: "*",
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(timeout('20m'));

app.post("/move_products_by_stores/move", async (req, res) => {
    try {
        const dealId = Array.from(req.body["document_id"]).find(item => item.includes("DEAL") ? item : null).split("_")[1]
        const dealProcessor = new DealProcessor(link);

        const deal = await dealProcessor.getDeal(dealId);

        const storeProcessor = new StoreProcessor(link);
        const writeOffResult = await storeProcessor.writeOffProductsFromStore(deal.products)
        if (writeOffResult) {
            const incomeResult = await storeProcessor.incomeProductsToStore(deal.products);
            if (incomeResult) {
                res.status(200).json({"status": true, "status_msg": "success", "message": "Товары успешно перемещены между складами"});
                return;
            }
        }

        res.status(500).json({status: "error", "status_msg": "error", "message": "Ошибка при перемещении товаров"});
    } catch (error) {
        logError("/move_products_by_stores/move", error)
        res.status(500).json({"status": false, "status_msg": "error", "message": "Сервер вернул ошибку"})
    }
});

app.post("/move_products_by_stores/writeoff", async (req, res) => {
   try {
       const dealId = Array.from(req.body["document_id"]).find(item => item.includes("DEAL") ? item : null).split("_")[1]
       const dealProcessor = new DealProcessor(link);

       const deal = await dealProcessor.getDeal(dealId);

       const storeProcessor = new StoreProcessor(link);

       deal.products.forEach(product => product.store_id = deal.store_from)

       const writeOffResult = await storeProcessor.writeOffProductsFromStore(deal.products)

       if (writeOffResult) {
           logSuccess("/move_products_by_stores/writeoff", `Products successfully wrote off from store. Deal: ${dealId}. Store from: ${deal.store_from}. Store to: ${deal.store_to}`);
           res.status(200).json({"status": true, "status_msg": "success", "message": `Products successfully wrote off from store. Deal: ${dealId}. Store from: ${deal.store_from}. Store to: ${deal.store_to}`})
       } else {
           logError("/move_products_by_stores/writeoff", `Error during writing off products from store. Deal: ${dealId}`);
           res.status(500).json({"status": false, "status_msg": "error", "message": `Error during writing off products from store. Deal: ${dealId}. Store from: ${deal.store_from}. Store to: ${deal.store_to}`})
       }
   } catch (error) {
       logError("/move_products_by_stores/writeoff", error);
       res.status(500).json({"status": false, "status_msg": "error", "message": "сервер вернул ошибку"})
   }
});

app.post("/move_products_by_stores/income", async (req, res) => {
    try {
        const dealId = Array.from(req.body["document_id"]).find(item => item.includes("DEAL") ? item : null).split("_")[1]
        const dealProcessor = new DealProcessor(link);

        const deal = await dealProcessor.getDeal(dealId);

        const storeProcessor = new StoreProcessor(link);

        deal.products.forEach(product => product.store_id = deal.store_to)

        const writeOffResult = await storeProcessor.incomeProductsToStore(deal.products)

        if (writeOffResult) {
            logSuccess("/move_products_by_stores/income", `Products successfully income to store. Deal: ${dealId}. Store from: ${deal.store_from}. Store to: ${deal.store_to}`);
            res.status(200).json({"status": true, "status_msg": "success", "message": `Products successfully income to store. Deal: ${dealId}. Store from: ${deal.store_from}. Store to: ${deal.store_to}`})
        } else {
            logError("/move_products_by_stores/income", `Error during incoming products to store. Deal: ${dealId}`);
            res.status(500).json({"status": false, "status_msg": "error", "message": `Error during incoming products to store. Deal: ${dealId}. Store from: ${deal.store_from}. Store to: ${deal.store_to}`})
        }
    } catch (error) {
        logError("/move_products_by_stores/writeoff", error);
        res.status(500).json({"status": false, "status_msg": "error", "message": "сервер вернул ошибку"})
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
