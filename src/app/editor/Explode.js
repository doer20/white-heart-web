import * as THREE from 'three';

import { SetValueCommand } from './commands/SetValueCommand.js';

var Explode = {

    explodeInit: function( editor, obj ) {
        if (obj.userData.explodeInit) {
            return;
        }
    
        const modelBox3 = new THREE.Box3();
        const meshBox3 = new THREE.Box3();
    
        //获取模型的包围盒
        modelBox3.expandByObject(obj);
    
        //计算模型的中心点坐标，这个为爆炸中心
        var modelWorldPs = new THREE.Vector3().addVectors(modelBox3.max, modelBox3.min).multiplyScalar(0.5);
    
        var testCenterPos = new THREE.Vector3(0,0,0);
    
        const meshes = obj.children;
    
        meshes.forEach(function(mesh) {
            mesh.traverse(function (value) {
                if(value.isMesh){
                    testCenterPos.add(value.position);
                    meshBox3.setFromObject(value);
    
                    //获取每个mesh的中心点，爆炸方向为爆炸中心点指向mesh中心点
                    var worldPs = new THREE.Vector3().addVectors(meshBox3.max, meshBox3.min).multiplyScalar(0.5);
                    if(isNaN(worldPs.x))return;
                    //计算爆炸方向
                    editor.execute( new SetValueCommand( editor, value.userData, 'worldDir', new THREE.Vector3().subVectors(worldPs, modelWorldPs).normalize() ) );
                    //保存初始坐标
                    editor.execute( new SetValueCommand( editor, value.userData, 'oldPs', value.getWorldPosition(new THREE.Vector3()) ) );
                }
            });
        });
        testCenterPos = testCenterPos.divideScalar(meshes.length);
    
        editor.execute( new SetValueCommand( editor, obj.userData, 'explodeInit', true ) );
    }
    
};

export { Explode };