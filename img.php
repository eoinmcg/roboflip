<?php 

if (count($_POST) && array_key_exists('img', $_POST))
{
	$game = explode('/', $_SERVER['HTTP_REFERER']);
	$game = $game[count($game) - 2];
	$path = $_SERVER['DOCUMENT_ROOT'] . '/arcade/roboflip/screenshots/';

	$img = $_POST['img'];
	$img = str_replace('data:image/png;base64', '', $img);
	$img = str_replace(' ', '+', $img);
	$data = base64_decode($img);
	$file = time() . '.png';
	// $res = file_put_contents($path . $file, $data);
	if (file_put_contents($path . $file, $data))
	{
		echo 'img saved: ' . $file;
	}
	else
	{
		echo 'save fail';
	}
}
else
{
	echo 'No data';
}
