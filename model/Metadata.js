const mongoose = require('mongoose');

const metadataSchema = new mongoose.Schema({
    ident: {
        type: String,
        //required: true,
        default: '0_0_0_000',
        min: 9,
        max: 9
    },
    title: {
        type: String,
        //required: true,
        default: '',
        min: 6,
        max: 255
    },
    author: {
        type: String,
        //required: true,
        default: '',
        min: 6
    },
    roleList: {
        type: Array,
        //required: ["role"],
        default: ["ruolo"],
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
        //required: true,
        default: '',
        max: 255,
        min: 6
    },
    doctypeList: {
        type: Array,
        //required: ["doctype"],
        default: [""],
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
        //required: ["topic"],
        default: [""],
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
        default: '',
        //required: true
    },
    provenance: {
        type: Array,
        //default: [],
        default: undefined,
        properties: {
            provenanceStatement: {
                type: String
            }
        }
    },
    abstract: {
        type: String,
        //required: true,
        default: '',
        min: 10,
        max: 5000
    },
    eventPlace: {
        type: String,
        required: false,
    },
    eventDate: {
        type: String,
        requires: false
    },
    additionalNotes: {
        type:String,
        required: false,
        max: 1024
    }
}, {collection: 'metadata'});

module.exports = mongoose.model('Metadata', metadataSchema);