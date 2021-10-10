import { UIRow, UIText, UIHorizontalRule, UIPanel } from '@src/app/libs/ui.js';

import { ModelSelector } from '@src/app/editor/ModelBar.Selector.js';

function ModelBar( editor ) {
	
	var strings = editor.strings;

	var container = new UIPanel();
	container.setId( 'modelBar' );

	var title = new UIRow();
	title.add( new UIText( strings.getKey( 'modelBar/title' ) ) ).setWidth( '90px' );
	title.setClass('title');
	title.setBorderTop( '0' );
	title.setPaddingTop( '20px' );
	container.add( title );
	container.add( new UIHorizontalRule() );

	container.add(new ModelSelector( editor ));

	return container;

}

export { ModelBar };
