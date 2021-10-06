import { UIPanel } from '@src/app/libs/ui.js';

import { MenubarAdd } from '@src/app/editor/Menubar.Add.js';
import { MenubarEdit } from '@src/app/editor/Menubar.Edit.js';
import { MenubarFile } from '@src/app/editor/Menubar.File.js';
import { MenubarExamples } from '@src/app/editor/Menubar.Examples.js';
import { MenubarView } from '@src/app/editor/Menubar.View.js';
import { MenubarHelp } from '@src/app/editor/Menubar.Help.js';
import { MenubarPlay } from '@src/app/editor/Menubar.Play.js';
import { MenubarStatus } from '@src/app/editor/Menubar.Status.js';

function Menubar( editor ) {

	var container = new UIPanel();
	container.setId( 'menubar' );

	container.add( new MenubarFile( editor ) );
	container.add( new MenubarEdit( editor ) );
	container.add( new MenubarAdd( editor ) );
	container.add( new MenubarPlay( editor ) );
	container.add( new MenubarExamples( editor ) );
	container.add( new MenubarView( editor ) );
	container.add( new MenubarHelp( editor ) );

	container.add( new MenubarStatus( editor ) );

	return container;

}

export { Menubar };
