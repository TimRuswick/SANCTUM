<?php
//header('Access-Control-Allow-Origin: *');
//header('Access-Control-Allow-Methods: GET, PUT, POST, DELETE, OPTIONS');
include_once 'functions.php';

if( isset($_GET['dataType']) ){ $dataType = $_GET['dataType']; } else{ $dataType = ''; };
if( isset($_GET['dataToSend']) ){ $dataToSend = $_GET['dataToSend']; } else{ $dataToSend = ''; };
if( isset($_GET['dataToSend2']) ){ $dataToSend2 = $_GET['dataToSend2']; } else{ $dataToSend2 = ''; };
if( isset($_GET['userid']) ){ $userID = $_GET['userid']; } else{ $userID = ''; };
if( isset($_GET['pk']) ){ $privateKey = $_GET['pk']; } else{ $privateKey = ''; };
$debug = false;

if($privateKey != privateKey()){
		echo throwError("invalidPrivateKey");
		exit;
}

$con = mysqlConnect();

switch ($dataType) {
				//gets all dammage from users
		case "sendAllAttacks":
				$message = "";
				$playerIDs = explode("|", $dataToSend);
				$hostileType = $dataToSend2;

				if (is_array($playerIDs)){
								foreach($playerIDs as $item) {
										$message .= "discordUserID = '".$item."' OR ";
								}
								$message = substr($message, 0, -4);
								//echo json_encode($playerIDs);
								//Get all user data
								$attackerStats= array();
								$q = "SELECT discordUserID,speed,maxHealth,health,strength FROM users WHERE $message;";
								$r2 = mysqli_query($con,$q);
								if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
									while ( $a = mysqli_fetch_assoc($r2) ) {
											$discordUserID=stripslashes($a['discordUserID']);
											$userHealth=stripslashes($a['health']);
											$userMaxHealth=stripslashes($a['maxHealth']);
											$userSpeed=stripslashes($a['speed']);
											$userStrength=stripslashes($a['strength']);
											$attackerStats[] = array('id'=>$discordUserID, 'maxHealth'=>$userHealth, 'health'=>$userHealth, 'speed'=>$userSpeed, 'strength'=>$userStrength, 'hitback'=>'');
									}
								}
								//Get enemy data
								$q = "SELECT hostiles.health,hostiles.maxHealth,hostiles.speed,hostiles.strength,hostiles.alive,hostiles.fled FROM hostiles WHERE hostileType = '$hostileType' ORDER BY id DESC LIMIT 1;";
								$r2 = mysqli_query($con,$q);
								if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
									while ( $a = mysqli_fetch_assoc($r2) ) {
											$hostileHealth=stripslashes($a['health']);
											$hostileMaxHealth=stripslashes($a['maxHealth']);
											$hostileSpeed=stripslashes($a['speed']);
											$hostileStrength=stripslashes($a['strength']);
											$hostileAlive=stripslashes($a['alive']);
											$hostileFled=stripslashes($a['fled']);
						$hostileID=stripslashes($a['id']);
									}
								}

								//do all the damage
								$totalDamage = 0;
								$returnInfo= array();
								$query = "UPDATE users SET health = CASE discordUserID ";
								$queryIDs = "";
								for ($i=0;$i<count($attackerStats);$i++){
									//$message += $attackerStats[$i][0];
									//If bad guy is still alive, carry on.
									if($hostileHealth > $attackerStats[$i]['strength']){
												$totalDamage = $totalDamage + $attackerStats[$i]['strength'];
												$hitAmount = getEnemyDamage($hostileSpeed,$attackerStats[$i]['speed'],$hostileStrength);
												if($hitAmount > 0){
														if ($hitAmount >= $attackerStats[$i]['health']){$hitAmount = $attackerStats[$i]['health'];};
														$attackerStats[$i]['health'] = $attackerStats[$i]['health'] - $hitAmount;
														$attackerStats[$i]['hitback'] = $hitAmount;
												}
												$query .= " WHEN ".$attackerStats[$i]['id']." THEN ".$attackerStats[$i]['health'];
												$queryIDs .= $attackerStats[$i]['id'].",";
												$hhealth = $hostileHealth-$totalDamage;
												$returnInfo[] = array('hostileHealth'=>$hhealth.'|'.$hostileMaxHealth, 'atkDamage'=>$attackerStats[$i]['strength'], 'id'=>$attackerStats[$i]['id'], 'hitback'=>$hitAmount, 'userHealth'=>$attackerStats[$i]['health']."|".$attackerStats[$i]['maxHealth']);
									}else{
										//If the bad guy is not alive, finish up.
															$q = "UPDATE hostiles SET health = 0 WHERE hostileType = '$hostileType' ORDER BY id DESC LIMIT 1";
															$r2 = mysqli_query($con,$q);
															$query .= " END
						             			WHERE discordUserID IN (".substr($queryIDs, 0, -1).");";
															$r2 = mysqli_query($con,$query);
															echo json_encode($returnInfo);
															exit;
									}

								// Changes dead values for Ravager
								if ($isDead) {
									$q = "UPDATE hostiles SET alive = 0 WHERE id = '$hostileID' LIMIT 1";
									$r2 = mysqli_query($con,$q);
									//$q = "UPDATE hostiles SET health = 0 WHERE hostileType = '$hostileType' ORDER BY id DESC LIMIT 1";
								}
			

								//assemble the end of the query.
								$query .= " END
								WHERE discordUserID IN (".substr($queryIDs, 0, -1).");";
								$r2 = mysqli_query($con,$query);
								$q = "UPDATE hostiles SET health = health - $totalDamage WHERE hostileType = '$hostileType' ORDER BY id DESC LIMIT 1";
								$r2 = mysqli_query($con,$q);
									echo json_encode($returnInfo);
									exit;



			}else{
					echo "notArray";
					exit;
			}

		break;

		case "lvlinfo":
				$q = "SELECT xp,lvl FROM users WHERE discordUserID = '$userID';";
				$r2 = mysqli_query($con,$q);
				if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
					while ( $a = mysqli_fetch_assoc($r2) ) {
							$xp=stripslashes($a['xp']);
							$currentlvl=stripslashes($a['lvl']);
							$lvlbase=getLevelBase();
							$lvl=getLevel($xp,$lvlbase);
							$level = $dataToSend2;
							$str = generateStatFromLevel($level,"str");
							$spd = generateStatFromLevel($level,"spd");
							$hp = generateStatFromLevel($level,"hp");
							$stash = generateStatFromLevel($level,"stash");

					}
				}
				//echo "LEVEL: ".getLevel($xp,$lvlbase),"<BR>XP: ".$xp."<BR>CURRENT LEVEL PROGRESS:".getCurrentLevelProgress($xp,$lvl);
				echo "LEVEL: ".getLevel($dataToSend,$lvlbase),"<BR>XP: ".$xp."<BR>CURRENT LEVEL PROGRESS:".getCurrentLevelProgress($xp,$lvl)."<BR><BR>STR: ".$str." SPD: ".$spd." HP: ".$hp." STASH:: ".$stash;
		break;

		case "attack":

					$q = "UPDATE hostiles SET health = health - $dataToSend WHERE id = '$dataToSend2' LIMIT 1";
					$r2 = mysqli_query($con,$q);
					$q = "UPDATE users SET stamina = stamina - 1 WHERE discordUserID = '$userID' LIMIT 1";
					$r2 = mysqli_query($con,$q);

					//$q = "INSERT INTO userLog (discordUserID, actionType, actionData)
					//VALUES (" . $userID . ", '" . $dataType . "', '$userID attacked Ravager#$dataToSend2.');";
					//$r2 = mysqli_query($con,$q);

					$q = "INSERT INTO attackLog (discordUserID, hostileID, damage)
					VALUES ('$userID','$dataToSend2','$dataToSend');";
					$r2 = mysqli_query($con,$q);

					$q = "SELECT hostiles.health,hostiles.maxHealth,hostiles.speed,hostiles.strength,users.speed as userspeed,users.health as userhealth FROM hostiles,users WHERE hostiles.id = '$dataToSend2' AND users.discordUserID = '$userID';";
					$r2 = mysqli_query($con,$q);
					if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
						while ( $a = mysqli_fetch_assoc($r2) ) {
								$hostileHealth=stripslashes($a['health']);
								$hostileMaxHealth=stripslashes($a['maxHealth']);
								$hostileSpeed=stripslashes($a['speed']);
								$hostileStrength=stripslashes($a['strength']);
								$userSpeed=stripslashes($a['userspeed']);
								$userHealth=stripslashes($a['userhealth']);
						}
						if($hostileHealth <= 0){
								if($hostileHealth < 0){ $hostileHealth = 0;};
								//returns health less than zero, kill enemy.
								$q = "UPDATE hostiles SET alive = 0,health = 0 WHERE id = '$dataToSend2' LIMIT 1";
								$r2 = mysqli_query($con,$q);
						}
						$criticalHit = 0;
						$hitAmount = getEnemyDamage($hostileSpeed,$userSpeed,$hostileStrength);
						if($hitAmount > 0){
								if ($hitAmount >= $userHealth){$hitAmount = $userHealth; $criticalHit = 1;};
								$q = "UPDATE users SET health = health - $hitAmount WHERE discordUserID = '$userID' LIMIT 1";
								$r2 = mysqli_query($con,$q);
						}
						echo $hostileHealth.",".$hostileMaxHealth.",".$hitAmount.",".$criticalHit;
						exit;
					} else{
						echo "0";
					}


					exit;


		break;

		case "hostileAttackBack":

					$q = "UPDATE users SET stamina = stamina - 1 WHERE discordUserID = '$userID' AND stamina > 0 LIMIT 1";
					$r2 = mysqli_query($con,$q);


					$q = "SELECT hostiles.health,hostiles.maxHealth,hostiles.speed,hostiles.strength,users.speed as userspeed,users.health as userhealth FROM hostiles,users WHERE hostiles.id = '$dataToSend2' AND users.discordUserID = '$userID';";
					$r2 = mysqli_query($con,$q);
					if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
						while ( $a = mysqli_fetch_assoc($r2) ) {
								$hostileHealth=stripslashes($a['health']);
								$hostileMaxHealth=stripslashes($a['maxHealth']);
								$hostileSpeed=stripslashes($a['speed']);
								$hostileStrength=stripslashes($a['strength']);
								$userSpeed=stripslashes($a['userspeed']);
								$userHealth=stripslashes($a['userhealth']);
						}
						$criticalHit = 0;
						$hitAmount = getEnemyDamage($hostileSpeed,$userSpeed,$hostileStrength);
						if($hitAmount > 0){
								if ($hitAmount >= $userHealth){$hitAmount = $userHealth; $criticalHit = 1;};
								$q = "UPDATE users SET health = health - $hitAmount WHERE discordUserID = '$userID' LIMIT 1";
								$r2 = mysqli_query($con,$q);
						}
						echo $hostileHealth.",".$hostileMaxHealth.",".$hitAmount.",".$criticalHit;
						exit;
					} else{
						echo "0";
					}


					exit;


		break;

		case "hostileFlee":
				$q = "SELECT id FROM hostiles WHERE alive = 1 ORDER BY id DESC LIMIT 1;";
				$r2 = mysqli_query($con,$q);
				if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
						while ( $a = mysqli_fetch_assoc($r2) ) {
								$hostileID=stripslashes($a['id']);
						}
						$q = "UPDATE hostiles SET fled = 1,alive=0 WHERE id = '$hostileID' LIMIT 1";
						$r2 = mysqli_query($con,$q);
						echo "fled";
				} else{
						echo "alreadyDead";
				}
		break;

		case "newHostile":
				$q = "SELECT id FROM hostiles WHERE alive = 1 LIMIT 1;";
				$r2 = mysqli_query($con,$q);
				if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
						echo "notCreated";
				} else{
							$elvl = $dataToSend;
							$healthBase = 50; $strengthBase = 3; $speedBase = 3; $stashBase = 3;
							$healthMin = ($healthBase * $elvl) / 2; $healthMax = $healthBase * $elvl;
							$strengthMin = ($strengthBase * $elvl) / 2; $strengthMax = $strengthBase * $elvl;
							$speedMin = ($speedBase * $elvl) / 2; $speedMax = $speedBase * $elvl;
							$stashMin = ($stashBase * $elvl) / 2; $stashMax = $stashBase * $elvl;

							$health = floor(rand($healthMin,$healthMax));
							$strength = floor(rand($strengthMin,$strengthMax));
							$speed = floor(rand($speedMin,$speedMax));
							$stash = floor(rand($stashMin,$stashMax));

							$claimID = floor(rand(1000,9999));
							$q = "INSERT INTO hostiles (hostileType, maxHealth, health, strength, speed, stash, alive, claimID)
																	VALUES ('ravager', '$health', '$health', '$strength', '$speed', '$stash', 1, '$claimID');";
							$r2 = mysqli_query($con,$q);
							echo $health.",".$speed.",".$strength.",".$claimID;
				}
		break;

		case "getHostileData":
					$q = "SELECT stash,claimID FROM hostiles WHERE alive = 0 AND id = '$dataToSend' LIMIT 1;";
					$r2 = mysqli_query($con,$q);
					if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
						while ( $a = mysqli_fetch_assoc($r2) ) {
								$stash=stripslashes($a['stash']);
								$claimID=stripslashes($a['claimID']);
						}
						echo $stash.",".$claimID;
					}
					exit;
		break;

		case "getDamageDistribution":
				//Gets base stats for enemy
				$q = "SELECT stash,maxHealth,fled FROM hostiles WHERE id = '$dataToSend' LIMIT 1;";
				$r2 = mysqli_query($con,$q);
				$a = mysqli_fetch_assoc($r2);
				$stash=stripslashes($a['stash']);
				$maxHealth=stripslashes($a['maxHealth']);
				$fled=stripslashes($a['fled']);
				$totalCrystalsInStash = 0;

				if($fled == 1){
							echo "fled";
				}else{
							//gets all dammage from users
							$damageDistribution = array();
							$q = "SELECT discordUserID,SUM(damage) totalDamage FROM attackLog WHERE hostileID = $dataToSend GROUP BY discordUserID;";
							//$q = "SELECT attackLog.damage,attackLog.discordUserID,hostiles.stash,hostiles.maxHealth FROM attackLog WHERE hostiles.id = attackLog.hostileID AND attackLog.hostileID = '$dataToSend';";
							$r2 = mysqli_query($con,$q);
							if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
								while ( $a = mysqli_fetch_assoc($r2) ) {
										$damage=stripslashes($a['totalDamage']);
										$discordUserID=stripslashes($a['discordUserID']);
										$damagePercent = round(( $damage / $maxHealth ) * 100);
										$percentStashAmount = round($stash * ($damagePercent/100));
										$totalCrystalsInStash += $percentStashAmount;
										// you can add single array values too
										$damageDistribution[] = array('id'=>$discordUserID, 'totalDamage'=>$damage, 'damagePercent'=>$damagePercent, 'crystalsReceived'=>$percentStashAmount);
										if($dataToSend2 == 1){
											//Flag to actually distribute crystals
											$q2 = "UPDATE users SET wallet = wallet + $percentStashAmount WHERE discordUserID = '$discordUserID' LIMIT 1";
											$r3 = mysqli_query($con,$q2);
										}

								}
								echo json_encode($damageDistribution);
							} else{
								echo 0;
							}
							exit;
				}

		break;
}

//echo json_encode($array);



if($debug){
	echo "\n"."UID:".$userID;
}

mysqli_close($con);


function getEnemyDamage($hostileSpeed,$userSpeed,$hostileStrength){
	$hitAmount = 0;
				$percentage = floor(rand(0,101));
				if($hostileSpeed > $userSpeed){
						if($percentage <= 80 ){
								//80% chance to hit you back.
								$hitAmount = $hostileStrength + rand(-($hostileStrength/4),$hostileStrength/4);
						}
				} else{
					 if($percentage <= 30){
							 //30% chance to hit you back.
							$hitAmount = $hostileStrength + rand(-($hostileStrength/4),$hostileStrength/4);
					 }
				}
/*
	if($hostileSpeed > $userSpeed){
		 if(20 > rand(0,100)){
				$hitAmount = $hostileStrength + rand(-($hostileStrength/4),$hostileStrength/4);
		 }
	} elseif($hostileSpeed == $userSpeed){
		 if(50 >= rand(0,100)){
				$hitAmount = $hostileStrength + rand(-($hostileStrength/4),$hostileStrength/4);
		 }
	} else{
		 if(70 >= rand(0,100)){
				$hitAmount = $hostileStrength + rand(-($hostileStrength/4),$hostileStrength/4);
		 }
	}
	*/
	return $hitAmount;
}


function generateStatFromLevel($level,$stat){
	$value = 0;
	switch (strtolower($stat)) {
		case "str":
		case "spd":
				$value = floor(log($level+1)*9-2.3);//NOTE THIS IS NATURAL LOG NOW, NOT THE BASE 10 LOG
				$value = round($value + (rand(-$value/10,$value/10)));
				if($level < 15) { $value = round($value * 0.9); }
			break;
		case "hp":
				$value = floor(50 + (30 * $level) + pow($level, 1.5));
			break;
		case "stash":
				$value = ceil(log($level+1)*2.25-0.43);//NOTE THIS IS NATURAL LOG NOW, NOT THE BASE 10 LOG
				$value = rand(pow($value, 2.2),pow($value, 2.3));
				if($level < 15) { $value = round($value * 0.7); }
			break;
	}

	return $value;
}

	?>
