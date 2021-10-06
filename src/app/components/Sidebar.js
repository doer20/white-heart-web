import { UITabbedPanel, UISpan } from '@src/app/libs/ui.js';

import { SidebarScene } from '@src/app/editor/Sidebar.Scene.js';
import { SidebarProperties } from '@src/app/editor/Sidebar.Properties.js';
import { SidebarScript } from '@src/app/editor/Sidebar.Script.js';
import { SidebarAnimation } from '@src/app/editor/Sidebar.Animation.js';
import { SidebarProject } from '@src/app/editor/Sidebar.Project.js';
import { SidebarSettings } from '@src/app/editor/Sidebar.Settings.js';

function Sidebar( editor ) {

	var strings = editor.strings;

	var container = new UITabbedPanel();
	container.setId( 'sidebar' );

	var scene = new UISpan().add(
		new SidebarScene( editor ),
		new SidebarProperties( editor ),
		new SidebarAnimation( editor ),
		new SidebarScript( editor )
	);
	var project = new SidebarProject( editor );
	var settings = new SidebarSettings( editor );

	container.addTab( 'scene', strings.getKey( 'sidebar/scene' ), scene );
	container.addTab( 'project', strings.getKey( 'sidebar/project' ), project );
	container.addTab( 'settings', strings.getKey( 'sidebar/settings' ), settings );
	container.select( 'scene' );

	return container;

}

export { Sidebar };
