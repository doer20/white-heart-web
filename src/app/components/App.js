import React, { Component } from 'react';
import * as THREE from 'three';
import '@src/css/main.css';

import { Editor } from '@src/app/editor/Editor.js' 
import { MainRender } from './MainRender.js';
import { Toolbar } from './Toolbar.js';
import { Player } from './Player.js';
import { Sidebar } from './Sidebar.js';
import { Menubar } from './Menubar.js';
import { Resizer } from './Resizer.js';

import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
 
class App extends Component {
    constructor(props) {
        super(props);
        this.state = {  };
    }
 
    initThree(){
        window.URL = window.URL || window.webkitURL;
        window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;

        Number.prototype.format = function () {

            return this.toString().replace( /(\d)(?=(\d{3})+(?!\d))/g, '$1,' );

        };

        //

        var editor = new Editor();

        window.editor = editor; // Expose editor to Console
        window.THREE = THREE; // Expose THREE to APP Scripts and Console
        window.VRButton = VRButton; // Expose VRButton to APP Scripts

        var mainRender = new MainRender( editor );
        document.body.appendChild( mainRender.dom );

        var toolbar = new Toolbar( editor );
        document.body.appendChild( toolbar.dom );

        var player = new Player( editor );
        document.body.appendChild( player.dom );

        var sidebar = new Sidebar( editor );
        document.body.appendChild( sidebar.dom );

        var menubar = new Menubar( editor );
        document.body.appendChild( menubar.dom );

        var resizer = new Resizer( editor );
        document.body.appendChild( resizer.dom );

        //

        editor.storage.init( function () {

            editor.storage.get( function ( state ) {

                if ( isLoadingFromHash ) return;

                if ( state !== undefined ) {

                    editor.fromJSON( state );

                }

                var selected = editor.config.getKey( 'selected' );

                if ( selected !== undefined ) {

                    editor.selectByUuid( selected );

                }

            } );

            //

            var timeout;

            function saveState() {

                if ( editor.config.getKey( 'autosave' ) === false ) {

                    return;

                }

                clearTimeout( timeout );

                timeout = setTimeout( function () {

                    editor.signals.savingStarted.dispatch();

                    timeout = setTimeout( function () {

                        editor.storage.set( editor.toJSON() );

                        editor.signals.savingFinished.dispatch();

                    }, 100 );

                }, 1000 );

            }

            var signals = editor.signals;

            signals.geometryChanged.add( saveState );
            signals.objectAdded.add( saveState );
            signals.objectChanged.add( saveState );
            signals.objectRemoved.add( saveState );
            signals.materialChanged.add( saveState );
            signals.sceneBackgroundChanged.add( saveState );
            signals.sceneFogChanged.add( saveState );
            signals.sceneGraphChanged.add( saveState );
            signals.scriptChanged.add( saveState );
            signals.historyChanged.add( saveState );

        } );

        //

        document.addEventListener( 'dragover', function ( event ) {

            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';

        }, false );

        document.addEventListener( 'drop', function ( event ) {

            event.preventDefault();

            if ( event.dataTransfer.types[ 0 ] === 'text/plain' ) return; // Outliner drop

            if ( event.dataTransfer.items ) {

                // DataTransferItemList supports folders

                editor.loader.loadItemList( event.dataTransfer.items );

            } else {

                editor.loader.loadFiles( event.dataTransfer.files );

            }

        }, false );

        function onWindowResize() {

            editor.signals.windowResize.dispatch();

        }

        window.addEventListener( 'resize', onWindowResize, false );

        onWindowResize();

        //

        var isLoadingFromHash = false;
        var hash = window.location.hash;

        if ( hash.substr( 1, 5 ) === 'file=' ) {

            var file = hash.substr( 6 );

            if ( window.confirm( 'Any unsaved data will be lost. Are you sure?' ) ) {

                var loader = new THREE.FileLoader();
                loader.crossOrigin = '';
                loader.load( file, function ( text ) {

                    editor.clear();
                    editor.fromJSON( JSON.parse( text ) );

                } );

                isLoadingFromHash = true;

            }

        }

        // ServiceWorker

        if ( 'serviceWorker' in navigator ) {

            try {

                navigator.serviceWorker.register( 'sw.js' );

            } catch ( error ) {

            }

        }
    }
 
    /**
     * 开始Three
     *
     * @memberof App
     */
    componentDidMount(){
        this.initThree();
    }
    render() {
        return (
            <div id='canvas-frame'>
            </div>
        );
    }
}
 
export default App;
