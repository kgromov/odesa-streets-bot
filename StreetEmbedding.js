
class StreetEmbedding {
  constructor({id, street_id, current_name, current_name_embeddings, old_name, old_name_embeddings}) {
    this.id = id;
    this.streetId = street_id;
    this.currentName = current_name;
    this.currentNameEmbeddings = current_name_embeddings;
    this.oldName = old_name;
    this.oldNameEmbeddings = old_name_embeddings
  }
}

module.exports = StreetEmbedding;
