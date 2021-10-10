import * as THREE from 'three';

import { UIPanel, UIRow, UISpan } from '@src/app/libs/ui.js';

function ModelSelector( editor ) {

	var container = new UISpan();
    container.setClass('models');

	var modelRows = new UIPanel();
	modelRows.setBorderTop( '0' );
	modelRows.setPaddingTop( '20px' );
	container.add( modelRows );

    const models = [
        {
            'id': 'baisuishan',
            'name': '百岁山',
            'file': 'baisuishan.obj',
            'extension': 'obj',
        },
        {
            'id': 'fenda',
            'name': '芬达',
            'file': 'fenda.obj',
            'extension': 'obj',
        },
        {
            'id': 'santory',
            'name': '三得利',
            'file': 'santory_small.glb',
            'extension': 'glb',
        },
        {
            'id': 'kouhong',
            'name': '口红',
            'file': 'kouhong.glb',
            'extension': 'glb',
        },
        {
            'id': 'yanxianbi',
            'name': '眼线笔',
            'file': 'yanxianbi.glb',
            'extension': 'glb',
        },
        {
            'id': 'dove',
            'name': '沐浴液',
            'file': 'dove.3dm',
            'extension': '3dm',
        }
    ];

    var loader = new THREE.FileLoader();
    models.forEach(function( modelInfo ) {
        var modelRow = new UIRow();
        modelRow.setTextContent( modelInfo.name );
        modelRow.setClass('model');

        modelRow.onClick(function (event) {

            const filename = modelInfo.file;
            const extension = modelInfo.extension;
            loader.setResponseType( editor.loader.contentType(extension) );
            loader.load('models/' + filename, function(content) {

                editor.loader.loadContent(extension, content, filename);

            });

        } );
        modelRows.add( modelRow );
    });
	return container;

}

export { ModelSelector };
