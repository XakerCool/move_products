const { Bitrix } = require("@2bad/bitrix")
const {logError} = require("./logger/logger");

class StoreProcessor {
    bx;
    writeOffProperties = {
        "docType": 'D',
        "currency": 'KZT',
        "responsibleId": '1',
    }
    incomeProperties = {
        "docType": 'S',
        "currency": 'KZT',
        "responsibleId": '1',
    }

    constructor(link) {
        this.bx = Bitrix(link);
    }

    async writeOffProductsFromStore(products) {
        try {
            const documentId = await this.createDocument(this.writeOffProperties);
            if (await this.addProductsToDocumentToWriteOff(documentId, products)) {
                return await this.bx.call("catalog.document.conduct", {"id": documentId}).catch(error => {
                    logError("storeProcessor incomeProductToStore catalog.document.conduct", error);
                });
            } else {
                return false;
            }
        } catch (error) {
            logError("storeProcessor incomeProductToStore", error);
        }
    }

    async incomeProductsToStore(products) {
        try {
            const documentId = await this.createDocument(this.incomeProperties);
            if (await this.addProductsToDocumentToIncome(documentId, products)) {
                return await this.bx.call("catalog.document.conduct", {"id": documentId}).catch(error => {
                    logError("storeProcessor incomeProductToStore catalog.document.conduct", error);
                });
            } else {
                return false;
            }
        } catch (error) {
            logError("storeProcessor incomeProductToStore", error);
        }
    }

    async addProductsToDocumentToWriteOff(documentId, products) {
        const promises = products.map(product => {
            return this.bx.call("catalog.document.element.add", {
                "fields": {
                    "docId": documentId,
                    "amount": product.quantity,
                    "elementId": product.id,
                    "storeFrom": product.store_id,
                    "commentary": `Данный документ с ID ${documentId} создан роботом для добавления`
                }
            }).then(res => {
                return res;
            }).catch(error => {
                logError("storeProcessor addProductsToDocument catalog.document.element.add", error)
            });
        });
        return Promise.all(promises)
            .then(results => {
                return results;
            })
            .catch(error => {
                logError("storeProcessor addProductsToDocument", error)
            });
    }

    async addProductsToDocumentToIncome(documentId, products) {
        const promises = products.map(product => {
            return this.bx.call("catalog.document.element.add", {
                "fields": {
                    "docId": documentId,
                    "amount": product.quantity,
                    "elementId": product.id,
                    "storeTo": product.store_id,
                    "commentary": `Данный документ с ID ${documentId} создан роботом для добавления`
                }
            }).then(res => {
                return res;
            }).catch(error => {
                logError("storeProcessor addProductsToDocument catalog.document.element.add", error)
            });
        });
        return Promise.all(promises)
            .then(results => {
                return results;
            })
            .catch(error => {
                logError("storeProcessor addProductsToDocument", error)
            });
    }

    async createDocument(properties) {
        try {
            const document = await this.bx.call("catalog.document.add", { "fields": properties }).catch(error => {
                logError("storeProcessor createDocument catalog.document.add", error)
            });
            return document.result.document.id;
        } catch (error) {
            logError("storeProcessor createDocument", error);
            return false;
        }
    }
}

module.exports = { StoreProcessor }