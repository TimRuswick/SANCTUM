<?php
//header('Access-Control-Allow-Origin: *');
//header('Access-Control-Allow-Methods: GET, PUT, POST, DELETE, OPTIONS');
include_once 'functions.php';

if( isset($_GET['dataToLoad']) ){ $dataToLoad = $_GET['dataToLoad']; } else{ $dataToLoad = ''; };
if( isset($_GET['userid']) ){ $userID = $_GET['userid']; } else{ $userID = ''; };
if( isset($_GET['pk']) ){ $privateKey = $_GET['pk']; } else{ $privateKey = ''; };
$sqlterms = '';
$debug = false;

if($privateKey != privateKey()){
		echo throwError("invalidPrivateKey");
		exit;
}


$con = mysqlConnect();

switch ($dataToLoad) {
case "hasConvertedToday":
		$q = "SELECT id FROM userLog WHERE actionTime >= (DATE_SUB(now(), INTERVAL 30 DAY)) AND actionType = 'conversion' AND discordUserID = '$userID';";
		$r2 = mysqli_query($con,$q);
		if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
			echo 1;
			exit;
		} else{
			echo 0;
		}
break;

case "account":
		$q = "SELECT wallet FROM users WHERE discordUserID = '$userID';";
		$r2 = mysqli_query($con,$q);
		if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
			while ( $a = mysqli_fetch_assoc($r2) ) {
					$account=stripslashes($a['wallet']);
			}
			echo $account;
			exit;
		} else{
			echo "{ERROR}";
		}
break;

case "bank":
		$q = "SELECT account FROM factions WHERE discordRoleID = '$userID';";
		$r2 = mysqli_query($con,$q);
		if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
			while ( $a = mysqli_fetch_assoc($r2) ) {
					$account=stripslashes($a['account']);
			}
			echo $account;
			exit;
		} else{
			echo "{ERROR}";
		}
break;

case "victors":
		$q = "SELECT discordRoleName FROM factions WHERE isCurrentVictor = '1';";
		$r2 = mysqli_query($con,$q);
		if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
			while ( $a = mysqli_fetch_assoc($r2) ) {
					$discordRoleName=stripslashes($a['discordRoleName']);
			}
			echo $discordRoleName;
			exit;
		} else{
			echo "0";
		}
break;
case "hostileActive":
		$q = "SELECT id FROM hostiles WHERE alive = 1 AND health > 0 AND fled = 0;";
		$r2 = mysqli_query($con,$q);
		if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
			while ( $a = mysqli_fetch_assoc($r2) ) {
					$hostileID=stripslashes($a['id']);
			}
			echo $hostileID;
			exit;
		} else{
			echo "0";
		}
break;
case "lastHostileActive":
		$q = "SELECT id FROM hostiles ORDER BY id DESC LIMIT 1;";
		$r2 = mysqli_query($con,$q);
		if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
			while ( $a = mysqli_fetch_assoc($r2) ) {
					$hostileID=stripslashes($a['id']);
			}
			echo $hostileID;
			exit;
		} else{
			echo "0";
		}
break;
case "userStats":
		$q = "SELECT strength,speed,stamina,health,maxStamina,maxHealth,wallet,xp,lvl,statPoints,chests FROM users WHERE discordUserID = '$userID';";
		$r2 = mysqli_query($con,$q);
		if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
			while ( $a = mysqli_fetch_assoc($r2) ) {
					$strength=stripslashes($a['strength']);
					$speed=stripslashes($a['speed']);
					$stamina=stripslashes($a['stamina']);
					$health=stripslashes($a['health']);
					$maxHealth=stripslashes($a['maxHealth']);
					$maxStamina=stripslashes($a['maxStamina']);
					$wallet=stripslashes($a['wallet']);
					$xp=stripslashes($a['xp']);
					$recordedLVL=stripslashes($a['lvl']);
					$statPoints=stripslashes($a['statPoints']);
					$chests=stripslashes($a['chests']);
					$lvlbase = getLevelBase();
					$lvl = getLevel($xp,$lvlbase);
					$lvlpercent = getCurrentLevelProgress($xp,$lvl);
			}
			echo $strength.",".$speed.",".$stamina.",".$health.",".$maxStamina.",".$maxHealth.",".$wallet.",".$xp.",".$recordedLVL.",".$lvlpercent.",".$statPoints.",".$chests;
			exit;
		} else{
			echo "0";
		}
break;



case "artifactsGet":

		$q = "SELECT scrap,common,uncommon,rare,ultrarare FROM artifacts WHERE discordUserID = '$userID';";
		$r2 = mysqli_query($con,$q);
		if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
					$a = mysqli_fetch_assoc($r2);
					$scrapQuantity=stripslashes($a['scrap']);
					$commonQuantity=stripslashes($a['common']);
					$uncommonQuantity=stripslashes($a['uncommon']);
					$rareQuantity=stripslashes($a['rare']);
					$ultrarareQuantity=stripslashes($a['ultrarare']);
					echo "success,".$ultrarareQuantity.",".$rareQuantity.",".$uncommonQuantity.",".$commonQuantity.",".$scrapQuantity;
		} else{
			echo "failure";
		}

break;


}



/*
if ($dataToLoad == "crystals"){
	echo "343 Crystals in the vault!";
} else{
	echo "No command found.";
}


if($featured==1){
		$sqlterms .= "AND userartistinfo.featured = 1 ";
}
if($search !== ''){
		$sqlterms .= "AND (userartistinfo.city LIKE '%".$search."%' OR userartistinfo.state LIKE '%".$search."%' OR userartistinfo.zip LIKE '%".$search."%')";
}
			$q = "SELECT
			user.id as artistid, user.slug, user.displayname, user.picurl,
			userartistinfo.genre, userartistinfo.views,
			userartistinfo.contactemail, userartistinfo.phone, userartistinfo.address, userartistinfo.city, userartistinfo.state, userartistinfo.zip, userartistinfo.website
			FROM user, userartistinfo
			where user.active = 1
			AND user.id = userartistinfo.id
			AND user.type = 'store'
			".$sqlterms."
			ORDER BY user.created DESC, views DESC
			LIMIT 15";

			$r2 = mysqli_query($con,$q);
			$i=0;
				if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
				  while ( $a = mysqli_fetch_assoc($r2) ) {

						$displayname = stripslashes($a['displayname']);
						$picurl = s3url('weedauthority-userimages', stripslashes($a['picurl']) );
						$phone = stripslashes($a['phone']);
						$address = stripslashes($a['address'])."<br />".stripslashes($a['city'])." ".stripslashes($a['state']).", ".stripslashes($a['zip']);
						$addressPlainText = stripslashes($a['address'])." ".stripslashes($a['city'])." ".stripslashes($a['state']).", ".stripslashes($a['zip']);
						$link = $baseurl."dispensary/".stripslashes($a['slug']);
						//$maplink ="https://maps.google.com/maps?q=". urlencode($addressPlainText);
						//$maplink = "https://www.google.com/maps/place/".urlencode($addressPlainText)."/";
						$maplink = stripslashes($a['website']);

						$statushtml = "<div id='build-" . $i . "' class='card'><div class='list-block beta-div'><div class='beta-title'>" . $displayname . "</div><img src='" . $picurl . "' class='beta-icon'>";
						$statushtml .=    "<div class='beta-version'><i class='fa fa-phone'></i> " . $phone . "</div><div class='beta-version'><i class='fa fa-map-marker'></i> " . $address . "</div><div class='beta-button'>";
						$statushtml .=    "<button class='button button-fill launchbutton launchbuttonactive launchbeta' data-url='" . $maplink . "'>View Shop</button>";
						//$statushtml .=    "<a href='geo://0,0?q=".$addressPlainText."' data-rel='external'><button class='button button-fill launchbutton launchbuttonactive launchbeta''>View Shop</button></a>";
						$statushtml .=    "</div><div style='clear:both;'></div><BR></div></div>";


					$array[$i]=array($statushtml );
					//$array[$i]=array($displayname,$picurl,$phone,$address,$link );
					//echo $title;
					$i++;
				  }
				}else{
						$array[0]=array("<BR /><BR /><center><i class='fa fa-search error-icon' aria-hidden='true'></i><BR /><BR />
						Looks like we can't find any shops matching that criteria. <BR />Try searching again!</center>");
						//echo json_encode($array);
				}

				echo json_encode($array);

//}

*/
if($debug){
	echo "\n"."UID:".$userID;
}

//mysqli_close($con);


	?>
