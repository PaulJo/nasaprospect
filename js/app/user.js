define( [ 
	"jquery",
	"app/shared",
	"app/utilities",
	"app/navigator",
	"app/solarSystem",
	"app/section",
	"TweenMax"
],
function ( $, _s, _utils, _navi, _ss, _section ) {
	
	var _de = _s.domElements;
	var _user = {};
	var _sectionActive;
	var _sectionTriggers = [];
	var _sectionOptions;
	var _sectionOptionsById = {};
	
	/*===================================================
	
	init
	
	=====================================================*/
	
	var _$element = _de.$user;
	var _$ui = _$element.find( '#userUI' );
	var _$charactersContainer = _$element.find( '#userCharacters' );
	
	var _$characters = _$charactersContainer.find( '.character' );
	var _charactersById = {};
	var _charactersActive = [];
	
	_$characters.each( function () {
		
		var $element = $( this );
		var id = $element.attr( 'id' );
		
		if ( typeof id === 'string' ) {
		
			// record original inline styles and init options
			
			var hide = $element.hasClass( 'hidden' );
			
			$element
				.removeClass( 'hidden' )
				.data( 'options', {
					base: {
						widthCSS: $element.prop("style")[ 'width' ],
						heightCSS: $element.prop("style")[ 'height' ],
						opacityCSS: $element.prop("style")[ 'opacity' ]
					},
					adjust: {}
				} );
			
			var options = $element.data( 'options' );
			var width = parseFloat( options.base.widthCSS );
			var height = parseFloat( options.base.heightCSS );
			var opacity = parseFloat( options.base.opacityCSS );
			
			// width
			
			if ( _utils.IsNumber( width ) ) {
				
				options.base.width = options.width = width;
				options.adjust.width = true;
				
				options.base.leftCSS = $element.prop("style")[ 'left' ];
				options.base.rightCSS = $element.prop("style")[ 'right' ];
				options.base.left = options.left = parseFloat( options.base.leftCSS );
				options.base.right = options.right = parseFloat( options.base.rightCSS );
				
				if ( _utils.IsNumber( options.base.left  ) ) {
					
					options.adjust.left = true;
					
				}
				
				if ( _utils.IsNumber( options.base.right  ) ) {
					
					options.adjust.right = true;
					
				}
				
			}
			else {
				
				options.base.width = options.width = 100;
				
			}
			
			// height
			
			if ( _utils.IsNumber( height ) ) {
				
				options.base.height = options.height = height;
				options.adjust.height = true;
				
				options.base.topCSS = $element.prop("style")[ 'top' ];
				options.base.bottomCSS = $element.prop("style")[ 'bottom' ];
				options.base.top = options.top = parseFloat( options.base.topCSS );
				options.base.bottom = options.bottom = parseFloat( options.base.bottomCSS );
				
				if ( _utils.IsNumber( options.base.top  ) ) {
					
					options.adjust.top = true;
					
				}
				
				if ( _utils.IsNumber( options.base.bottom  ) ) {
					
					options.adjust.bottom = true;
					
				}
				
			}
			else {
				
				options.base.height = options.height = 100;
				
			}
			
			// opacity
			
			if ( _utils.IsNumber( opacity ) ) {
				
				options.base.opacity = options.opacity = opacity;
				
			}
			else {
				
				options.base.opacity = options.opacity = 1;
				
			}
			
			
			// store
			
			_charactersById[ id ] = $element;
			
			// hide after init complete
			
			if ( hide === true ) {
				
				//Grow( id, { width: 0, height: 0 } );
				Fade( id, { opacity: 0 } );
			}
			
		}
		
	} );
	
	var _offset = _$element.offset();
	
	_s.signals.onResized.add( Resize );
	_s.signals.onReady.addOnce( function () {
		
		_s.signals.onUpdated.add( Update );
		
	} );
	
	_ss.onSectionActivated.add( SetActiveSection );
	
	/*===================================================
	
	section
	
	=====================================================*/
	
	function SetActiveSection ( section ) {
		
		if ( _sectionActive !== section ) {
			
			_sectionActive = section;
			
			// reset section data
			
			_navi.RemoveTriggers( _sectionTriggers );
			
			_sectionTriggers = [];
			_sectionOptions = _sectionOptionsById[ _sectionActive.id ] = _sectionOptionsById[ _sectionActive.id ] || {};
			
			if ( _sectionActive instanceof _section.Instance ) {
				
				// if will be resizing characters while in section
				
				InitSectionModifiers( _sectionActive );
				
			}
			
		}
		
	}
	
	/*===================================================
	
	modifiers
	
	=====================================================*/
	
	function InitSectionModifiers ( section ) {
		
		if ( _sectionOptions.$modifiers instanceof $ !== true ) {
			
			_sectionOptions.$modifiers = section.$element.find( '[data-character-modify]' );
			_sectionOptions.modifiersTriggers = [];
			
		}
		
		_sectionOptions.$modifiers.each( function ( index ) {
			
			var $element = $( this );
			var modTriggers = _sectionOptions.modifiersTriggers[ index ];
			var i, il;
			
			// generate triggers on first init
			
			if ( _utils.IsArray( modTriggers ) !== true ) {
				
				var modsString = $.trim( $element.attr( 'data-character-modify' ) );
				var modsStrings = modsString.split( /[ \t\r]+/g );
				
				modTriggers = [];
				
				for ( i = 0, il = modsStrings.length; i < il; i++ ) {
					
					var modTrigger = GenerateModifierTrigger( $element, modsStrings[ i ] );
					
					if ( typeof modTrigger !== 'undefined' ) {
						
						modTriggers.push( modTrigger );
						
					}
					
				}
				
				// store
				
				_sectionOptions.modifiersTriggers[ index ] = modTriggers;
				
			}
			
			_sectionTriggers = _sectionTriggers.concat( _navi.AddTriggers( modTriggers ) );
			
		} );
		
	}
	
	function GenerateModifierTrigger ( $element, modString ) {
		
		var modParts = $.trim( modString ).split( /\/|\\/ );
		var type = modParts[ 0 ];
		var idsString = modParts[ 1 ];
		var ids = idsString ? idsString.split( ',' ) : [];
		
		if ( typeof _user[ type ] === 'function' && ids.length > 0 ) {
			
			var direction = modParts[ 2 ];
			var propertiesString = modParts[ 3 ];
			var propertiesList = propertiesString ? propertiesString.split( ',' ) : [];
			var properties = {};
			
			// parse properties
			
			properties.pctStart = parseFloat( propertiesList[ 0 ] );
			properties.pctEnd = parseFloat( propertiesList[ 1 ] );
			
			if ( isNaN( properties.pctStart ) ) properties.pctStart = 0;
			else properties.pctStart = _utils.Clamp( properties.pctStart, 0, 1 );
			
			if ( isNaN( properties.pctEnd ) ) properties.pctEnd = 1;
			else properties.pctEnd = _utils.Clamp( properties.pctEnd, properties.pctStart, 1 );
			
			properties.toggle = propertiesList[ 2 ];
			
			if ( properties.toggle === 'in' ) {
				
				properties.pctStartToggle = parseFloat( propertiesList[ 3 ] );
				properties.pctEndToggle = parseFloat( propertiesList[ 4 ] );
				
				if ( isNaN( properties.pctStartToggle ) ) properties.pctStartToggle = properties.pctStart;
				else properties.pctStartToggle = _utils.Clamp( properties.pctStartToggle, properties.pctStart, properties.pctEnd );
				
				if ( isNaN( properties.pctEndToggle ) ) properties.pctEndToggle = properties.pctEnd;
				else properties.pctEndToggle = _utils.Clamp( properties.pctEndToggle, properties.pctStartToggle, properties.pctEnd );
				
			}
			
			// build trigger
			
			var modTrigger = {
				callbackCenterContinuous: function ( trigger ) {
					
					var scrollDirection = _navi.GetScrollDirection().y;
					var scrolling, antiscrolling;
					
					if ( scrollDirection < 0 ) {
						
						scrolling = 'up';
						antiscrolling = 'down';
						
					}
					else {
						
						scrolling = 'down';
						antiscrolling = 'up';
						
					}
					
					var directional = direction === 'concat';
					
					for ( var i = 0, il = ids.length; i < il; i++ ) {
						
						_user[ type ]( ids[ i ], {
							element: $element,
							bounds: trigger.bounds,
							direction: directional ? scrolling : direction,
							scrollDirection: scrollDirection,
							scrolling: scrolling,
							antiscrolling: antiscrolling,
							directional: directional,
							properties: properties
						} );
						
					}
					
				},
				element: $element
			};
			
			// make sure that we modify one last time upon leaving area / removing trigger
			
			modTrigger.callbackCenterOutside = modTrigger.callbackCenterContinuous;
			
			return modTrigger;
		
		}
		
	}
	
	function GetModifierPct ( $element, parameters ) {
		
		var direction = parameters.direction;
		var properties = parameters.properties;
		var scrollPositionCenterY = _navi.GetScrollCenterPosition().y;
		var bounds = parameters.bounds || _utils.DOMBounds( $element );
		var top = bounds.top;
		var bottom = bounds.bottom;
		var topToBottom = bottom - top;
		var boundsDistanceV;
		var pct;
		var pctRange = properties.pctEnd - properties.pctStart;
		var toggle = properties.toggle;
		var topToggle, bottomToggle;
		
		if ( toggle === 'in' ) {
			
			topToggle = top + topToBottom *  properties.pctStartToggle;
			bottomToggle = bottom - ( topToBottom - topToBottom * properties.pctEndToggle );
			
		}
		
		top += topToBottom * properties.pctStart;
		boundsDistanceV = topToBottom * pctRange;
		bottom = top + boundsDistanceV;
		
		var distanceV = scrollPositionCenterY - top;
		
		// total pct of 0
		
		if ( pctRange <= 0 ) {
			
			if ( direction === 'up' ) {
				
				if ( scrollPositionCenterY > bottom ) {
					
					pct = 0;
					
				}
				else {
					
					pct = 1;
					
				}
				
			}
			else {
				
				if ( scrollPositionCenterY < top ) {
					
					pct = 0;
					
				}
				else {
					
					pct = 1;
					
				}
				
			}
			
		}
		// toggle
		else if ( toggle === 'in' ) {
			
			if ( scrollPositionCenterY <= topToggle ) {
				
				pct = _utils.Clamp( distanceV / ( topToggle - top ), 0, 1 );
				
			}
			else if ( scrollPositionCenterY >= bottomToggle ) {
				
				pct = _utils.Clamp( 1 - ( scrollPositionCenterY - bottomToggle ) / ( bottom - bottomToggle ), 0, 1 );
				
			}
			else {
				
				pct = 1;
				
			}
			
		}
		// pct by direction
		else {
			
			if ( direction === 'up' ) {
				
				pct = _utils.Clamp( 1 - distanceV / boundsDistanceV, 0, 1 );
				
			}
			// default to down
			else {
				
				pct = _utils.Clamp( distanceV / boundsDistanceV, 0, 1 );
				
			}
			
		}
		console.log( 'pct ', pct, 'toggle', toggle, 'top', top, bounds.top, 'bottom', bottom, bounds.bottom, 'scrollPositionCenterY', scrollPositionCenterY, ' distanceV', distanceV );
		return pct;
		
	}
	
	/*===================================================
	
	fade
	
	=====================================================*/
	
	function Fade ( id, parameters ) {
		
		parameters = parameters || {};
		
		// handle directional
		
		if ( parameters.directional === true ) {
			
			// hide opposite
			
			Fade( id + parameters.antiscrolling, { opacity: 0 } );
			
			id += parameters.scrolling;
			
		}
		console.log( 'Fade', id );
		var $character = _charactersById[ id ];
		
		if ( $character instanceof $ ) {
			
			var options = $character.data( 'options' );
			if ( options.tweening === true ) {
				
				options.tweening = false;
				TweenMax.killTweensOf( options );
				
			}
			
			// reset size
			
			if ( options.height !== options.base.height || options.width !== options.base.width ) {
				
				Grow( id );
				
			}
			
			var $element = $( parameters.element );
			
			// based on scroll
			
			if ( $element.length > 0 ) {
				
				var pct = GetModifierPct( $element, parameters );
				
				options.opacity = pct;
				
				UpdateCharacterOpacity( $character );
			
			}
			// tween to
			else {
				
				var duration = _utils.IsNumber( parameters.duration ) ? parameters.duration : 0;
				if ( _utils.IsNumber( parameters.opacity ) !== true ) parameters.opacity = options.base.opacity;
				parameters.easing = parameters.easing || Strong.easeIn;
				parameters.onUpdate = function () {
					
					UpdateCharacterOpacity( $character );
					
				};
				
				options.tweening = true;
				TweenMax.to( options, duration, parameters );
				
			}
			
		}
		
	}
	
	function UpdateCharacterOpacity ( $character ) {
		
		var options = $character.data( 'options' );
		
		if ( options.opacityLast !== options.opacity ) {
			
			options.opacityLast = options.opacity;
			
			$character.css( 'opacity', options.opacity );
			
		}
		
	}
	
	/*===================================================
	
	resize
	
	=====================================================*/
	
	function Grow ( id, parameters ) {
		
		parameters = parameters || {};
		
		// handle directional
		
		if ( parameters.directional === true ) {
			
			// hide opposite
			
			Grow( id + parameters.antiscrolling, { width: 0, height: 0 } );
			
			id += parameters.scrolling;
			
		}
		console.log( 'Grow', id );
		var $character = _charactersById[ id ];
		
		if ( $character instanceof $ ) {
			
			var options = $character.data( 'options' );
			if ( options.tweening === true ) {
				
				options.tweening = false;
				TweenMax.killTweensOf( options );
				
			}
			
			// reset fading
			
			if ( options.opacity !== options.base.opacity ) {
				
				Fade( id );
				
			}
			
			parameters = parameters || {};
			var $element = $( parameters.element );
			
			// based on scroll
			
			if ( $element.length > 0 ) {
				
				var pct = GetModifierPct( $element, parameters );
				
				if ( options.adjust.width === true ) options.width = options.base.width * pct;
				if ( options.adjust.height === true ) options.height = options.base.height * pct;
				
				UpdateCharacterSize( $character );
				
			}
			// for tween
			else {
				
				if ( options.adjust.width !== true ) delete parameters.width;
				else if ( _utils.IsNumber( parameters.width ) !== true ) parameters.width = options.base.width;
				
				if ( options.adjust.height !== true ) delete parameters.height;
				else if ( _utils.IsNumber( parameters.height ) !== true ) parameters.height = options.base.height;
				
				var duration = _utils.IsNumber( parameters.duration ) ? parameters.duration : 0;
				parameters.easing = parameters.easing || Strong.easeIn;
				parameters.onUpdate = function () {
					
					UpdateCharacterSize( $character );
					
				};
				
				options.tweening = true;
				TweenMax.to( options, duration, parameters );
				
			}
			
		}
		
	}
	
	function UpdateCharacterSize ( $character ) {
		
		var options = $character.data( 'options' );
		
		if ( options.adjust.width === true && options.widthLast !== options.width ) {
			
			options.widthLast = options.width;
			
			$character.css( 'width', options.width + '%' );
			
			if ( options.adjust.left === true ) {
				
				$character.css( 'left', ( 100 - options.width ) * 0.5 + '%' );
				
			}
			
			if ( options.adjust.right === true ) {
				
				$character.css( 'right', ( 100 - options.width ) * 0.5 + '%' );
				
			}
			
		}
		
		if ( options.adjust.height === true && options.heightLast !== options.height ) {
			
			options.heightLast = options.height;
			
			$character.css( 'height', options.height + '%' );
			
			// TODO: adjust top/bottom based on base top/bottom and base height
			
			if ( options.adjust.top === true ) {
				
				$character.css( 'top', ( 100 - options.height ) * 0.5 + '%' );
				
			}
			
			if ( options.adjust.bottom === true ) {
				
				$character.css( 'bottom', ( 100 - options.height ) * 0.5 + '%' );
				
			}
			
		}
		
	}
	
	/*===================================================
	
	update
	
	=====================================================*/
	
	function Update () {
		
	}
	
	/*===================================================
	
	resize
	
	=====================================================*/
	
	function Resize () {
		
	}
	
	/*===================================================
	
	public
	
	=====================================================*/
	
	_user.Grow = Grow;
	_user.Fade = Fade;
	
	return _user;
	
} );