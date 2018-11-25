<?php
//header('Access-Control-Allow-Origin: *');
//header('Access-Control-Allow-Methods: GET, PUT, POST, DELETE, OPTIONS');
include_once 'functions.php';

if( isset($_GET['pk']) ){ $privateKey = $_GET['pk']; } else{ $privateKey = ''; };
$sqlterms = '';
$debug = false;

if($privateKey != "123"){
		echo throwError("invalidPrivateKey");
		exit;
}
?>
<HTML>
	<HEAD>
		<TITLE>THE CODEX</TITLE>
<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.19/css/jquery.dataTables.css">

<script
  src="https://code.jquery.com/jquery-3.3.1.min.js"
  integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8="
  crossorigin="anonymous"></script>
<script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.10.19/js/jquery.dataTables.js"></script>
</HEAD>

<BODY>

	<table id="table_id" class="display">
	    <thead>
	        <tr>
	            <th>ID</th>
	            <th>Level</th>
				<th>Stat Points</th>
	            <th>Crystals</th>
	            <th>SPD</th>
	            <th>STR</th>
	            <th>STAM</th>
	            <th>HP</th>
	        </tr>
	    </thead>
	    <tbody>

<?php
$con = mysqlConnect();
$q = "SELECT discordUserID,wallet,speed,health,maxHealth,strength,maxStamina,stamina,lvl,statPoints FROM users LIMIT 500;";
$r2 = mysqli_query($con,$q);
if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
	while ( $a = mysqli_fetch_assoc($r2) ) {
			$discordUserID=stripslashes($a['discordUserID']);
			$wallet=stripslashes($a['wallet']);
			$speed=stripslashes($a['speed']);
			$health=stripslashes($a['health']);
			$maxHealth=stripslashes($a['maxHealth']);
			$strength=stripslashes($a['strength']);
			$maxStamina=stripslashes($a['maxStamina']);
			$stamina=stripslashes($a['stamina']);
			$lvl=stripslashes($a['lvl']);
			$statPoints=stripslashes($a['statPoints']);

			?>

			        <tr>
			            <td><?php echo $discordUserID; ?></td>
			            <td><?php echo $lvl; ?></td>
						<td><?php echo $statPoints; ?></td>
			            <td><?php echo $wallet; ?></td>
			            <td><?php echo $speed; ?></td>
			            <td><?php echo $strength; ?></td>
			            <td><?php echo $stamina."/".$maxStamina; ?></td>
			            <td><?php echo $health."/".$maxHealth; ?></td>
			        </tr>
			<?php
	}
}
 ?>
</tbody>
</table>
<script>
$(document).ready( function () {
    $('#table_id').DataTable();
} );
</script>
</BODY>
</HTML>
