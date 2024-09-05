const { Bitrix } = require("@2bad/bitrix")
const {logError} = require("./logger/logger");

class DealProcessor {
    bx;

    constructor(link) {
        this.bx = Bitrix(link);
    }

    async getDeal (dealId) {
        return new Promise(async (resolve, reject) => {
            try {
                const deal = {}
                const userFieldsOfStores = await this.getDealCustomFieldsOfStores();
                await this.bx.deals.get(dealId).then(async res => {
                    deal.id = res.result["ID"]
                    deal.title = res.result["TITLE"]
                    deal.stage_semantic_id = res.result["STAGE_SEMANTIC_ID"]
                    deal.stage_id = res.result["STAGE_ID"]
                    deal.type_id = res.result["TYPE_ID"]
                    deal.products = await this.getDealProducts(dealId)
                    deal.store_from = res.result[userFieldsOfStores["Склад отправитель"]]
                    deal.store_to = res.result[userFieldsOfStores["Склад получатель"]]
                }).catch(error => {
                    logError("DealProcessor getDeal this.bitrix.deals.get", error)
                    resolve(null)
                })
                resolve(deal)
            } catch (error) {
                logError("DealProcessor getDeal", error)
            }
        })
    }

    async getDealProducts(dealId) {
        return new Promise(async (resolve, reject) => {
            try {
                let products = []
                await this.bx.call("crm.deal.productrows.get", { id: dealId }).then(res => {
                    Array.from(res.result).forEach(product => {
                        products.push(
                            {
                                id: product["PRODUCT_ID"],
                                name: product["PRODUCT_NAME"],
                                original_name: product["ORIGINAL_PRODUCT_NAME"],
                                quantity: product["QUANTITY"],
                                store_id: product["STORE_ID"]
                            }
                        )
                    })
                }).catch(error => {
                    logError("DealProcessor getDealProducts", error)
                    resolve(null)
                })
                if (products.find(product => !product.store_id)) {
                    logError("DealOperator getDealProducts", "Store is null")
                    resolve(null)
                }
                resolve(products)
            } catch (error) {
                logError("DealOperator getDealProducts", error)
            }
        })
    }

    async getDealCustomFieldsOfStores() {
        return new Promise(async (resolve, reject) => {
            try {
                const fields = (await this.bx.call("crm.deal.fields")).result;
                let data = {};
                for (let key in fields) {
                    if (fields.hasOwnProperty(key)) {
                        if (fields[key]?.listLabel?.toString() === "Склад отправитель" || fields[key]?.formLabel?.toString() === "Склад отправитель" || fields[key]?.filterLabel?.toString() === "Склад отправитель") {
                            data["Склад отправитель"] = fields[key].title
                        }
                        if (fields[key]?.listLabel?.toString() === "Склад получатель" || fields[key]?.formLabel?.toString() === "Склад получатель" || fields[key]?.filterLabel?.toString() === "Склад получатель") {
                            data["Склад получатель"] = fields[key].title
                        }
                    }
                }
                resolve(data);
            } catch (error) {
                logError("DealProcessor getDealCustomFields", error)
            }
        })
    }
}

module.exports = { DealProcessor }