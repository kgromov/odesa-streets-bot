class StreetEmbeddings {
    constructor({id, streetId, current_name, current_name_embeddings, old_name, old_name_embeddings}) {
        this.id = id;
        this.streetId = streetId;
        this.currentName = current_name;
        this.currentNameEmbeddings = current_name_embeddings;
        this.oldName = old_name;
        this.oldNameEmbeddings = old_name_embeddings;
    }

    toString() {
        return `[${this.id}], ${this.streetId}, "${this.oldName}" → "${this.currentName}"]`;
    }
}

module.exports = StreetEmbeddings;
