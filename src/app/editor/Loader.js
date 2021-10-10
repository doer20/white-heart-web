import * as THREE from 'three';

import { TGALoader } from 'three/examples/jsm/loaders/TGALoader.js';
import { unzipSync, strFromU8 } from 'three/examples/jsm/libs/fflate.module.js';

import { AddObjectCommand } from './commands/AddObjectCommand.js';
import { SetSceneCommand } from './commands/SetSceneCommand.js';

import { LoaderUtils } from './LoaderUtils.js';

class Loader {
    constructor(editor) {

        var scope = this;

        this.texturePath = '';

        this.loadItemList = function (items) {

            LoaderUtils.getFilesFromItemList(items, function (files, filesMap) {

                scope.loadFiles(files, filesMap);

            });

        };

        this.loadFiles = function (files, filesMap) {

            if (files.length > 0) {

                var filesMap = filesMap || LoaderUtils.createFilesMap(files);

                var manager = createDefaultManager();
                manager.setURLModifier(function (url) {

                    url = url.replace(/^(\.?\/)/, ''); // remove './'

                    var file = filesMap[url];

                    if (file) {

                        console.log('Loading', url);

                        return URL.createObjectURL(file);

                    }

                    return url;

                });

                for (var i = 0; i < files.length; i++) {

                    scope.loadFile(files[i], manager);

                }

            }

        };

        this.loadFile = function (file, manager) {

            var filename = file.name;
            var extension = filename.split('.').pop().toLowerCase();

            var reader = new FileReader();
            reader.addEventListener('progress', function (event) {

                var size = '(' + Math.floor(event.total / 1000).format() + ' KB)';
                var progress = Math.floor((event.loaded / event.total) * 100) + '%';

                console.log('Loading', filename, size, progress);

            });

            var readType = scope.contentType(extension);
            if (readType === 'arraybuffer') {
                reader.addEventListener('load', async function (event) {

                    var contents = event.target.result;

                    scope.loadContent(extension, contents, filename, manager);

                }, false);
                reader.readAsArrayBuffer(file);
            } else {
                reader.addEventListener('load', async function (event) {

                    var contents = event.target.result;

                    scope.loadContent(extension, contents, filename, manager);

                }, false);
                reader.readAsText(file);
            }

        };

        this.loadContent = async function (extension, contents, filename, manager) {
            var manager = manager || createDefaultManager();
            switch (extension) {

                case '3dm':

                    var { Rhino3dmLoader } = await import('three/examples/jsm/loaders/3DMLoader.js');

                    var loader = new Rhino3dmLoader();
                    // loader.setLibraryPath('three/examples/jsm/libs/rhino3dm/');
                    loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/');
                    loader.parse(contents, function (object) {

                        editor.execute(new AddObjectCommand(editor, object));

                    });

                    break;

                case '3ds':

                    var { TDSLoader } = await import('three/examples/jsm/loaders/TDSLoader.js');

                    var loader = new TDSLoader();
                    var object = loader.parse(contents);

                    editor.execute(new AddObjectCommand(editor, object));

                    break;

                case '3mf':

                    var { ThreeMFLoader } = await import('three/examples/jsm/loaders/3MFLoader.js');

                    var loader = new ThreeMFLoader();
                    var object = loader.parse(contents);

                    editor.execute(new AddObjectCommand(editor, object));

                    break;

                case 'amf':

                    var { AMFLoader } = await import('three/examples/jsm/loaders/AMFLoader.js');

                    var loader = new AMFLoader();
                    var amfobject = loader.parse(contents);

                    editor.execute(new AddObjectCommand(editor, amfobject));

                    break;

                case 'dae':

                    var { ColladaLoader } = await import('three/examples/jsm/loaders/ColladaLoader.js');

                    var loader = new ColladaLoader(manager);
                    var collada = loader.parse(contents);

                    collada.scene.name = filename;

                    editor.execute(new AddObjectCommand(editor, collada.scene));

                    break;

                case 'drc':

                    var { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');

                    var loader = new DRACOLoader();
                    loader.setDecoderPath('three/examples/js/libs/draco/');
                    loader.decodeDracoFile(contents, function (geometry) {

                        var object;

                        if (geometry.index !== null) {

                            var material = new THREE.MeshStandardMaterial();

                            object = new THREE.Mesh(geometry, material);
                            object.name = filename;

                        } else {

                            var material = new THREE.PointsMaterial({ size: 0.01 });
                            material.vertexColors = geometry.hasAttribute('color');

                            object = new THREE.Points(geometry, material);
                            object.name = filename;

                        }

                        editor.execute(new AddObjectCommand(editor, object));

                    });

                    break;

                case 'fbx':

                    var { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');

                    var loader = new FBXLoader(manager);
                    var object = loader.parse(contents);

                    editor.execute(new AddObjectCommand(editor, object));

                    break;

                case 'glb':

                    var { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');
                    var { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');

                    var dracoLoader = new DRACOLoader();
                    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/');
                    dracoLoader.setDecoderConfig({type: 'js'});

                    var loader = new GLTFLoader();
                    loader.setDRACOLoader(dracoLoader);
                    loader.parse(contents, '', function (result) {

                        var scene = result.scene;
                        scene.name = filename;

                        scene.animations.push(...result.animations);
                        editor.execute(new AddObjectCommand(editor, scene));

                    });

                    break;

                case 'gltf':

                    var loader;

                    if (isGLTF1(contents)) {

                        alert('Import of glTF asset not possible. Only versions >= 2.0 are supported. Please try to upgrade the file to glTF 2.0 using glTF-Pipeline.');

                    } else {

                        var { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');
                        var { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');

                        var dracoLoader = new DRACOLoader();
                        dracoLoader.setDecoderPath('three/examples/js/libs/draco/gltf/');

                        loader = new GLTFLoader(manager);
                        loader.setDRACOLoader(dracoLoader);

                    }

                    loader.parse(contents, '', function (result) {

                        var scene = result.scene;
                        scene.name = filename;

                        scene.animations.push(...result.animations);
                        editor.execute(new AddObjectCommand(editor, scene));

                    });

                    break;

                case 'js':
                case 'json':
                    // 2.0
                    if (contents.indexOf('postMessage') !== -1) {

                        var blob = new Blob([contents], { type: 'text/javascript' });
                        var url = URL.createObjectURL(blob);

                        var worker = new Worker(url);

                        worker.onmessage = function (event) {

                            event.data.metadata = { version: 2 };
                            handleJSON(event.data);

                        };

                        worker.postMessage(Date.now());

                        return;

                    }

                    // >= 3.0
                    var data;

                    try {

                        data = JSON.parse(contents);

                    } catch (error) {

                        alert(error);
                        return;

                    }

                    handleJSON(data);

                    break;

                case 'ifc':

                    var { IFCLoader } = await import('three/examples/jsm/loaders/IFCLoader.js');

                    var loader = new IFCLoader();
                    loader.ifcManager.setWasmPath('three/examples/jsm/loaders/ifc/');

                    var model = await loader.parse(contents);
                    model.mesh.name = filename;

                    editor.execute(new AddObjectCommand(editor, model.mesh));

                    break;

                case 'kmz':

                    var { KMZLoader } = await import('three/examples/jsm/loaders/KMZLoader.js');

                    var loader = new KMZLoader();
                    var collada = loader.parse(contents);

                    collada.scene.name = filename;

                    editor.execute(new AddObjectCommand(editor, collada.scene));

                    break;

                case 'ldr':
                case 'mpd':

                    var { LDrawLoader } = await import('three/examples/jsm/loaders/LDrawLoader.js');

                    var loader = new LDrawLoader();
                    loader.fileMap = {}; // TODO Uh...
                    loader.setPath('three/examples/models/ldraw/officialLibrary/');
                    loader.parse(contents, undefined, function (group) {

                        group.name = filename;
                        // Convert from LDraw coordinates: rotate 180 degrees around OX
                        group.rotation.x = Math.PI;

                        editor.execute(new AddObjectCommand(editor, group));

                    });

                    break;

                case 'md2':

                    var { MD2Loader } = await import('three/examples/jsm/loaders/MD2Loader.js');

                    var geometry = new MD2Loader().parse(contents);
                    var material = new THREE.MeshStandardMaterial({
                        morphTargets: true,
                        morphNormals: true
                    });

                    var mesh = new THREE.Mesh(geometry, material);
                    mesh.mixer = new THREE.AnimationMixer(mesh);
                    mesh.name = filename;

                    mesh.animations.push(...geometry.animations);
                    editor.execute(new AddObjectCommand(editor, mesh));

                    break;

                case 'obj':

                    var { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');

                    var object = new OBJLoader().parse(contents);
                    object.name = filename;

                    editor.execute(new AddObjectCommand(editor, object));

                    break;

                case 'ply':

                    var { PLYLoader } = await import('three/examples/jsm/loaders/PLYLoader.js');

                    var geometry = new PLYLoader().parse(contents);
                    var object;

                    if (geometry.index !== null) {

                        var material = new THREE.MeshStandardMaterial();

                        object = new THREE.Mesh(geometry, material);
                        object.name = filename;

                    } else {

                        var material = new THREE.PointsMaterial({ size: 0.01 });
                        material.vertexColors = geometry.hasAttribute('color');

                        object = new THREE.Points(geometry, material);
                        object.name = filename;

                    }

                    editor.execute(new AddObjectCommand(editor, object));

                    break;

                case 'stl':

                    var { STLLoader } = await import('three/examples/jsm/loaders/STLLoader.js');

                    var geometry = new STLLoader().parse(contents);
                    var material = new THREE.MeshStandardMaterial();

                    var mesh = new THREE.Mesh(geometry, material);
                    mesh.name = filename;

                    editor.execute(new AddObjectCommand(editor, mesh));

                    break;

                case 'svg':

                    var { SVGLoader } = await import('three/examples/jsm/loaders/SVGLoader.js');

                    var loader = new SVGLoader();
                    var paths = loader.parse(contents).paths;

                    //
                    var group = new THREE.Group();
                    group.scale.multiplyScalar(0.1);
                    group.scale.y *= -1;

                    for (var i = 0; i < paths.length; i++) {

                        var path = paths[i];

                        var material = new THREE.MeshBasicMaterial({
                            color: path.color,
                            depthWrite: false
                        });

                        var shapes = SVGLoader.createShapes(path);

                        for (var j = 0; j < shapes.length; j++) {

                            var shape = shapes[j];

                            var geometry = new THREE.ShapeGeometry(shape);
                            var mesh = new THREE.Mesh(geometry, material);

                            group.add(mesh);

                        }

                    }

                    editor.execute(new AddObjectCommand(editor, group));

                    break;

                case 'vox':
                    var { VOXLoader, VOXMesh } = await import('three/examples/jsm/loaders/VOXLoader.js');

                    var chunks = new VOXLoader().parse(contents);

                    var group = new THREE.Group();
                    group.name = filename;

                    for (let i = 0; i < chunks.length; i++) {

                        const chunk = chunks[i];

                        const mesh = new VOXMesh(chunk);
                        group.add(mesh);

                    }

                    editor.execute(new AddObjectCommand(editor, group));

                    break;

                case 'vtk':

                    var { VTKLoader } = await import('three/examples/jsm/loaders/VTKLoader.js');

                    var geometry = new VTKLoader().parse(contents);
                    var material = new THREE.MeshStandardMaterial();

                    var mesh = new THREE.Mesh(geometry, material);
                    mesh.name = filename;

                    editor.execute(new AddObjectCommand(editor, mesh));

                    break;

                case 'wrl':

                    var { VRMLLoader } = await import('three/examples/jsm/loaders/VRMLLoader.js');

                    var result = new VRMLLoader().parse(contents);

                    editor.execute(new SetSceneCommand(editor, result));

                    break;

                case 'xyz':

                    var { XYZLoader } = await import('three/examples/jsm/loaders/XYZLoader.js');

                    var geometry = new XYZLoader().parse(contents);

                    var material = new THREE.PointsMaterial();
                    material.vertexColors = geometry.hasAttribute('color');

                    var points = new THREE.Points(geometry, material);
                    points.name = filename;

                    editor.execute(new AddObjectCommand(editor, points));

                    break;

                case 'zip':

                    handleZIP(contents);

                    break;

                default:

                    console.error('Unsupported file format (' + extension + ').');

                    break;

            }
        }

        this.contentType = function(extension) {
            switch (extension) {

                case '3dm':
                case '3ds':
                case '3mf':
                case 'amf':
                case 'drc':
                case 'fbx':
                case 'glb':
                case 'gltf':
                case 'ifc':
                case 'kmz':
                case 'md2':
                case 'ply':
                case 'stl':
                case 'vox':
                case 'vtk':
                case 'zip':

                    return 'arraybuffer';

                case 'dae':
                case 'js':
                case 'json':
                case 'ldr':
                case 'mpd':
                case 'obj':
                case 'svg':
                case 'wrl':
                case 'xyz':

                    return 'text';

                default:

                    console.error('Unsupported file format (' + extension + ').');

                    break;

            }
        }

        function createDefaultManager() {
            var manager = new THREE.LoadingManager();
            manager.setURLModifier(function (url) {

                url = url.replace(/^(\.?\/)/, ''); // remove './'

                return url;

            });

            manager.addHandler(/\.tga$/i, new TGALoader());
            return manager;
        }

        function handleJSON(data) {

            if (data.metadata === undefined) { // 2.0

                data.metadata = { type: 'Geometry' };

            }

            if (data.metadata.type === undefined) { // 3.0

                data.metadata.type = 'Geometry';

            }

            if (data.metadata.formatVersion !== undefined) {

                data.metadata.version = data.metadata.formatVersion;

            }

            switch (data.metadata.type.toLowerCase()) {

                case 'buffergeometry':

                    var loader = new THREE.BufferGeometryLoader();
                    var result = loader.parse(data);

                    var mesh = new THREE.Mesh(result);

                    editor.execute(new AddObjectCommand(editor, mesh));

                    break;

                case 'geometry':

                    console.error('Loader: "Geometry" is no longer supported.');

                    break;

                case 'object':

                    var loader = new THREE.ObjectLoader();
                    loader.setResourcePath(scope.texturePath);

                    loader.parse(data, function (result) {

                        if (result.isScene) {

                            editor.execute(new SetSceneCommand(editor, result));

                        } else {

                            editor.execute(new AddObjectCommand(editor, result));

                        }

                    });

                    break;

                case 'app':

                    editor.fromJSON(data);

                    break;

            }

        }

        async function handleZIP(contents) {

            var zip = unzipSync(new Uint8Array(contents));

            // Poly
            if (zip['model.obj'] && zip['materials.mtl']) {

                var { MTLLoader } = await import('three/examples/jsm/loaders/MTLLoader.js');
                var { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');

                var materials = new MTLLoader().parse(strFromU8(zip['materials.mtl']));
                var object = new OBJLoader().setMaterials(materials).parse(strFromU8(zip['model.obj']));
                editor.execute(new AddObjectCommand(editor, object));

            }

            //
            for (var path in zip) {

                var file = zip[path];

                var manager = new THREE.LoadingManager();
                manager.setURLModifier(function (url) {

                    var file = zip[url];

                    if (file) {

                        console.log('Loading', url);

                        var blob = new Blob([file.buffer], { type: 'application/octet-stream' });
                        return URL.createObjectURL(blob);

                    }

                    return url;

                });

                var extension = path.split('.').pop().toLowerCase();

                switch (extension) {

                    case 'fbx':

                        var { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');

                        var loader = new FBXLoader(manager);
                        var object = loader.parse(file.buffer);

                        editor.execute(new AddObjectCommand(editor, object));

                        break;

                    case 'glb':

                        var { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');
                        var { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');

                        var dracoLoader = new DRACOLoader();
                        dracoLoader.setDecoderPath('three/examples/js/libs/draco/gltf/');

                        var loader = new GLTFLoader();
                        loader.setDRACOLoader(dracoLoader);

                        loader.parse(file.buffer, '', function (result) {

                            var scene = result.scene;

                            scene.animations.push(...result.animations);
                            editor.execute(new AddObjectCommand(editor, scene));

                        });

                        break;

                    case 'gltf':

                        var { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');
                        var { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');

                        var dracoLoader = new DRACOLoader();
                        dracoLoader.setDecoderPath('three/examples/js/libs/draco/gltf/');

                        var loader = new GLTFLoader(manager);
                        loader.setDRACOLoader(dracoLoader);
                        loader.parse(strFromU8(file), '', function (result) {

                            var scene = result.scene;

                            scene.animations.push(...result.animations);
                            editor.execute(new AddObjectCommand(editor, scene));

                        });

                        break;

                }

            }

        }

        function isGLTF1(contents) {

            var resultContent;

            if (typeof contents === 'string') {

                // contents is a JSON string
                resultContent = contents;

            } else {

                var magic = THREE.LoaderUtils.decodeText(new Uint8Array(contents, 0, 4));

                if (magic === 'glTF') {

                    // contents is a .glb file; extract the version
                    var version = new DataView(contents).getUint32(4, true);

                    return version < 2;

                } else {

                    // contents is a .gltf file
                    resultContent = THREE.LoaderUtils.decodeText(new Uint8Array(contents));

                }

            }

            var json = JSON.parse(resultContent);

            return (json.asset != undefined && json.asset.version[0] < 2);

        }

    }
}

export { Loader };
