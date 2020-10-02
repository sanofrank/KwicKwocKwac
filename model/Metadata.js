const mongoose = require('mongoose');

const metadataSchema = new mongoose.Schema({
    ident: {
        type: String,
        required: true,
        min: 9,
        max: 9
    },
    title: {
        type: String,
        required: true,
        min: 6,
        max: 255
    },
    author: {
        type: String,
        required: true,
        min: 6
    },
    roleList: {
        type: Array,
        required: ["role"],
        properties: {
            role: {
                type: String,
                min: 6,
                max: 255,
            }
        }
    },
    curator: {
        type: String,
        required: true,
        max: 255,
        min: 6
    },
    doctypeList: {
        type: Array,
        required: ["doctype"],
        properties: {
            doctype: {
                type: String,
                min: 6,
                max: 225
            }
        }
    },
    doctopicList: {
        type: Array,
        required: ["topic"],
        properties: {
            topic: {
                type: String,
                min: 6,
                max: 225
            }
        }
    },
    docstatus: {
        type: String,
        required: true
    },
    provenance: {
        type: Array,
        default: undefined,
        properties: {
            provenanceStatement: {
                type: String
            }
        }
    },
    abstract: {
        type: String,
        required: true,
        min: 10,
        max: 1024
    },
    eventPlace: {
        type: String,
        required: false,
    },
    eventDate: {
        type: Number,
        requires: false
    },
    additionalNotes: {
        type:String,
        required: false,
        max: 1024
    }
}, {collection: 'metadata'});

module.exports = mongoose.model('Metadata', metadataSchema);