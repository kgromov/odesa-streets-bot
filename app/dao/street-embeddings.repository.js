const {v4: uuidv4} = require('uuid');
const AbstractRepository = require("./abstract.repository");
const StreetEmbeddings = require("../model/StreetEmbeddings");

class StreetEmbeddingsRepository extends AbstractRepository{

    constructor() {
        super();
    }

    findByStreetId(streetId) {
        return this._queryOne(`SELECT * FROM ${this._tableName()} WHERE streetId = ?`, streetId);
    }

    saveAll(streetEmbeddings) {
        // this.commit(() => {
        //     const statement = this._db.prepare(`INSERT INTO streets_embeddings VALUES (?, ?, ?, ?, ?, ?)`);
        //     streetEmbeddings.forEach((streetEmbedding) => statement.run(
        //         uuidv4(),
        //         streetEmbedding.streetId,
        //         streetEmbedding.currentName,
        //         streetEmbedding.currentNameEmbeddings,
        //         streetEmbedding.oldName,
        //         streetEmbedding.oldNameEmbeddings
        //     ));
        // });

        this._commit(() => {
            streetEmbeddings.forEach((streetEmbedding) => this.save(streetEmbedding));
        });
    }

    save(streetEmbedding) {
        this._commit(() => {
            const statement = this._db.prepare(`INSERT INTO ${this._tableName()} VALUES (?, ?, ?, ?, ?, ?)`);
            statement.run(
                uuidv4(),
                streetEmbedding.streetId,
                streetEmbedding.currentName,
                streetEmbedding.currentNameEmbeddings,
                streetEmbedding.oldName,
                streetEmbedding.oldNameEmbeddings
            );
        });
    }

    _tableName() {
        return 'streets_embeddings';
    }

    _mapToStreetEmbeddings(row) {
        return new StreetEmbeddings({
            ...row,
            current_name_embeddings: new Float32Array(row.current_name_embeddings.buffer),
            old_name_embeddings: new Float32Array(row.old_name_embeddings.buffer),
        });
    }
}

module.exports = StreetEmbeddingsRepository;