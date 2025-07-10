<?php
// This file is generated. Do not modify it manually.
return array(
	'active-accordion' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'srg/media-accordion',
		'version' => '0.1.0',
		'title' => 'Media Accordion',
		'category' => 'widgets',
		'icon' => 'list-view',
		'description' => 'An interactive block for displaying images and videos in a flexible, accordion-style layout.',
		'attributes' => array(
			'uid' => array(
				'type' => 'string',
				'default' => ''
			)
		),
		'example' => array(
			
		),
		'supports' => array(
			'html' => false
		),
		'textdomain' => 'media-accordion',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'viewScript' => 'file:./view.js'
	),
	'active-accordion-item' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'srg/media-accordion-item',
		'version' => '0.1.0',
		'title' => 'Media Accordion Item',
		'parent' => array(
			'srg/media-accordion'
		),
		'category' => 'widgets',
		'icon' => 'smiley',
		'description' => 'Example block scaffolded with Create Block tool.',
		'attributes' => array(
			'title' => array(
				'type' => 'string',
				'default' => ''
			),
			'duration' => array(
				'type' => 'number',
				'default' => 3000
			),
			'mediaId' => array(
				'type' => 'number'
			),
			'mediaUrl' => array(
				'type' => 'string',
				'default' => ''
			),
			'mime' => array(
				'type' => 'string',
				'default' => ''
			)
		),
		'example' => array(
			
		),
		'supports' => array(
			'html' => false
		),
		'textdomain' => 'media-accordion-item',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'viewScript' => 'file:./view.js'
	)
);
