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
		case "conversion":
				$q = "INSERT INTO userLog (discordUserID, actionType, actionData)
				VALUES (" . $userID . ", '" . $dataType . "', '" . $dataToSend . "');";
				$r2 = mysqli_query($con,$q);
		break;
		case "newUser":
		/*
				$q = "INSERT INTO users (discordUserID,wallet)
							SELECT * FROM (SELECT '$userID',0) AS tmp
							WHERE NOT EXISTS (
								SELECT discordUserID FROM users WHERE discordUserID = '$userID'
							) LIMIT 1;";
				$r2 = mysqli_query($con,$q);
				*/

				$q = "SELECT id FROM users WHERE discordUserID = '$userID' LIMIT 1;";
				$r2 = mysqli_query($con,$q);
				if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
					echo "userAlreadyExists";
				} else{
						$q = "INSERT INTO users (discordUserID,wallet)
									SELECT * FROM (SELECT '$userID',0) AS tmp
									WHERE NOT EXISTS (
										SELECT discordUserID FROM users WHERE discordUserID = '$userID'
									) LIMIT 1;";
						$r2 = mysqli_query($con,$q);
						echo "createdUser";
				}
		break;
		case "checkin":
				$q = "SELECT id,actionTime FROM userLog WHERE actionTime >= CURDATE() AND actionType = 'checkin' AND discordUserID = '$userID';";
				$r2 = mysqli_query($con,$q);
				if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
							//already checked in today.
							$a = mysqli_fetch_assoc($r2);
							$flastupdated=stripslashes($a['actionTime']);

							$timeAgoObject = new convertToAgo; // Create an object for the time conversion functions
							// Query your database here and get timestamp
							$ts = $flastupdated;
							$convertedTime = ($timeAgoObject -> convert_datetime($ts)); // Convert Date Time
							$when = ($timeAgoObject -> makeAgo($convertedTime)); // Then convert to ago time
							//date("F j, Y, g:i a", strtotime($flastupdated));
					echo $when;
				} else{
					//Can check in.
					$q = "UPDATE users SET wallet = wallet + $dataToSend WHERE discordUserID = '$userID' LIMIT 1";
					$r2 = mysqli_query($con,$q);

							$q = "INSERT INTO userLog (discordUserID, actionType, actionData)
							VALUES (" . $userID . ", '" . $dataType . "', 'Checked in for $dataToSend crystals.');";
							$r2 = mysqli_query($con,$q);
					echo "available";
					exit;
				}
		break;

		case "deposit":
				$q = "SELECT wallet FROM users WHERE discordUserID = '$userID';";
				$r2 = mysqli_query($con,$q);
				if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
					while ( $a = mysqli_fetch_assoc($r2) ) {
							$account=stripslashes($a['wallet']);
					}
					if($account >= $dataToSend && $dataToSend > 0){
							//has enough credits in their account
							$q = "UPDATE users SET wallet = wallet - $dataToSend WHERE discordUserID = '$userID' LIMIT 1";
							$r2 = mysqli_query($con,$q);

							$q = "UPDATE factions SET account = account + $dataToSend WHERE discordRoleID = '$dataToSend2' LIMIT 1";
							$r2 = mysqli_query($con,$q);

							$q = "INSERT INTO userLog (discordUserID, actionType, actionData)
							VALUES (" . $userID . ", '" . $dataType . "', 'Deposited $dataToSend crystals to $dataToSend2.');";
							$r2 = mysqli_query($con,$q);
							echo 1;
					} else{
						echo "{ERROR} - Not enough crystals in your account.";
					}
					exit;
				} else{
					echo "{ERROR} - Cant find wallet. Something went wrong.";
				}
		break;

		case "gambleWon":
					$q = "UPDATE users SET wallet = wallet + $dataToSend WHERE discordUserID = '$userID' LIMIT 1";
					$r2 = mysqli_query($con,$q);

							$q = "INSERT INTO userLog (discordUserID, actionType, actionData)
							VALUES (" . $userID . ", '" . $dataType . "', 'Gambled and won for $dataToSend crystals.');";
							$r2 = mysqli_query($con,$q);
					echo 1;
					exit;

		break;
		case "gambleLost":
					$q = "UPDATE users SET wallet = wallet - $dataToSend WHERE discordUserID = '$userID' LIMIT 1";
					$r2 = mysqli_query($con,$q);

							$q = "INSERT INTO userLog (discordUserID, actionType, actionData)
							VALUES (" . $userID . ", '" . $dataType . "', 'Gambled and lost for $dataToSend crystals.');";
							$r2 = mysqli_query($con,$q);
					echo 1;
					exit;

		break;

		case "transfer":
				$q = "SELECT discordUserID FROM users WHERE discordUserID = '$dataToSend' LIMIT 1";
				$r2 = mysqli_query($con,$q);
				if ( $r2 == false || mysqli_num_rows($r2) == 0 ) {
					return "failure";
				} else {
					$q = "UPDATE users SET wallet = wallet - $dataToSend2 WHERE discordUserID = '$userID' LIMIT 1";
					$r2 = mysqli_query($con,$q);
					$q = "UPDATE users SET wallet = wallet + $dataToSend2 WHERE discordUserID = '$dataToSend' LIMIT 1";
					$r2 = mysqli_query($con,$q);

					$q = "INSERT INTO userLog (discordUserID, actionType, actionData)
						VALUES (" . $userID . ", '" . $dataType . "', '$userID gave $dataToSend2 crystals to $dataToSend.');";
					$r2 = mysqli_query($con,$q);
					echo "success";
					exit;
				}
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




		case "claim":
					$claimAmount = $dataToSend2;


					$q = "SELECT stash FROM hostiles WHERE alive = 0 AND claimID = '$dataToSend' LIMIT 1;";
					$r2 = mysqli_query($con,$q);
					if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
						while ( $a = mysqli_fetch_assoc($r2) ) {
								$stash=stripslashes($a['stash']);
						}
						if($claimAmount <= $stash){
								//take money from the stash
								$q = "UPDATE hostiles SET stash = stash - $claimAmount WHERE claimID = '$dataToSend' LIMIT 1";
								$r2 = mysqli_query($con,$q);
								$q = "UPDATE users SET wallet = wallet + $claimAmount WHERE discordUserID = '$userID' LIMIT 1";
								$r2 = mysqli_query($con,$q);

													$q = "INSERT INTO userLog (discordUserID, actionType, actionData)
													VALUES (" . $userID . ", '" . $dataType . "', '$userID claimed $claimAmount crystals from a Ravager.');";
													$r2 = mysqli_query($con,$q);
								$stash = $stash - $claimAmount;
								if($stash == 0){
										$q = "UPDATE hostiles SET claimID=0 WHERE claimID = '$dataToSend' LIMIT 1";
										$r2 = mysqli_query($con,$q);
								}
								echo $stash;
						}else{
							echo "notEnough";
						}
						exit;
					} else{
						echo "noClaimID";
					}


					exit;

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


		case "updateStamina":
					$q = "UPDATE users SET stamina = stamina + 1 WHERE stamina < maxStamina;";
					$r2 = mysqli_query($con,$q);
					//UPDATE users SET health = min(floor(health + (maxHeath/100)), maxHealth)
					$q = "UPDATE users SET health = least(floor(health + (maxHealth/100)), maxHealth) WHERE health < maxHealth AND health > 0;";
					$r2 = mysqli_query($con,$q);
					exit;
		break;


		case "reviveAll":
					$q = "UPDATE users SET health = 1 WHERE health = 0;";
					$r2 = mysqli_query($con,$q);
					$q = "INSERT INTO userLog (discordUserID, actionType, actionData)
					VALUES (0,'revive','reviveAll');";
					$r2 = mysqli_query($con,$q);
					exit;
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

					}
				}
				//echo "LEVEL: ".getLevel($xp,$lvlbase),"<BR>XP: ".$xp."<BR>CURRENT LEVEL PROGRESS:".getCurrentLevelProgress($xp,$lvl);
				echo "LEVEL: ".getLevel($dataToSend,$lvlbase),"<BR>XP: ".$xp."<BR>CURRENT LEVEL PROGRESS:".getCurrentLevelProgress($xp,$lvl);
		break;

		case "upgradeStats":
				//Changed it to just upgrade 1 point automatically
				$dataToSend2 = 1;
				$q = "SELECT statPoints FROM users WHERE discordUserID = '$userID';";
				$r2 = mysqli_query($con,$q);
				if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
					while ( $a = mysqli_fetch_assoc($r2) ) {
							$statPoints=stripslashes($a['statPoints']);
					}
					if($dataToSend2 <= $statPoints){
						$tableName = "";
						switch (strtoupper($dataToSend)) {
								case "STR":
									$tableName = "strength = strength + ".$dataToSend2;
								break;
								case "HP":
									$tableName = "maxHealth = maxHealth + 10";
								break;
								case "SPD":
									$tableName = "speed = speed + ".$dataToSend2;
								break;
								case "STAM":
									$tableName = "maxStamina = maxStamina + ".$dataToSend2;
								break;
						}
							$q = "UPDATE users SET statPoints = statPoints - $dataToSend2,$tableName WHERE discordUserID = '$userID' LIMIT 1";
							$r2 = mysqli_query($con,$q);
							echo "success";
					} else{
							echo "notEnoughPoints";
					}
				} else{
					echo "failure";
				}

		break;




		case "heal":
				$q = "SELECT health,maxHealth,wallet FROM users WHERE discordUserID = '$userID';";
				$r2 = mysqli_query($con,$q);
				if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
					while ( $a = mysqli_fetch_assoc($r2) ) {
							$health=stripslashes($a['health']);
							$maxHealth=stripslashes($a['maxHealth']);
							$crystals=stripslashes($a['wallet']);
					}
					$treatmentCost = $dataToSend;
					$treatmentName = $dataToSend2;
					$newHealth = $health;
					if($health == $maxHealth){echo "fullHealth";exit;}

					if($health > 0){
							if($crystals >= $treatmentCost){
										switch ($treatmentName) {
												case "TREAT":
																$newHealth += 15;
												break;
												case "TREATV2":
																$newHealth = $maxHealth*0.15;
												break;
												case "PATCH":
																$newHealth += 50;
												break;
												case "PATCHV2":
																$newHealth = $maxHealth*0.5;
												break;
												case "REGEN":
																$newHealth += 100;
												break;
												case "REGENV2":
																$newHealth = $maxHealth;
												break;
												default:
														echo "cantDoThat";exit;
												break;
										}
											if($newHealth < $health){echo "lessThanYourHealth";exit;}
											if($newHealth>$maxHealth){$newHealth = $maxHealth;};
											$q = "UPDATE users SET health = $newHealth,wallet = wallet - $treatmentCost WHERE discordUserID = '$userID' LIMIT 1";
											$r2 = mysqli_query($con,$q);
											echo "success,".$newHealth."/".$maxHealth;
						} else{
							echo "notEnoughCrystals";
						}
					} else{
									if($crystals >= $treatmentCost){
												switch ($treatmentName) {
														case "REVIVE":
																			$newHealth = 25;
														break;
														case "REVIVEV2":
																			$newHealth = $maxHealth*0.5;
														break;
														case "REVIVEV3":
																			$newHealth = $maxHealth;
														break;
														case "TREAT":
																		echo "youreKnockedOut";exit;
														break;
														case "TREATV2":
																		echo "youreKnockedOut";exit;
														break;
														case "PATCH":
																		echo "youreKnockedOut";exit;
														break;
														case "PATCHV2":
																		echo "youreKnockedOut";exit;
														break;
														case "REGEN":
																		echo "youreKnockedOut";exit;
														break;
														default:
																echo "cantDoThat";exit;
														break;
												}
												if($newHealth < $health){echo "lessThanYourHealth";exit;}
												if($newHealth>$maxHealth){$newHealth = $maxHealth;};
												$q = "UPDATE users SET health = $newHealth,wallet = wallet - $treatmentCost WHERE discordUserID = '$userID' LIMIT 1";
												$r2 = mysqli_query($con,$q);
												echo "success,".$newHealth."/".$maxHealth;
										}else{
											echo "notEnoughCrystals";
										}
					}
				} else{
					echo "failure";
				}

		break;



		case "addXP":
				addXp($userID,$dataToSend);
		break;

		case "getLevelUp":
				$levelCap = 30;
				$levelCapXP = 625;
				$q = "SELECT xp,lvl,statPoints FROM users WHERE discordUserID = '$userID';";
				$r2 = mysqli_query($con,$q);
				if ( $r2 && mysqli_num_rows($r2) > 0 ) {
							while ( $a = mysqli_fetch_assoc($r2) ) {
									$xp=stripslashes($a['xp']);
									$lvl=stripslashes($a['lvl']);
									$statPoints=stripslashes($a['statPoints']);
							}
							$lvlbase = getLevelBase();
							$currentLVL = floor(getLevel($xp,$lvlbase));
							if($currentLVL > $lvl){
									if($currentLVL > $levelCap){
											$q = "UPDATE users SET lvl = $levelCap, xp = $levelCapXP WHERE discordUserID = '$userID' LIMIT 1";
											$r2 = mysqli_query($con,$q);
									}else{
											$statPoints += 1;
											$q = "UPDATE users SET lvl = lvl + 1,statPoints = statPoints + 1 WHERE discordUserID = '$userID' LIMIT 1";
											$r2 = mysqli_query($con,$q);
									}
									echo "levelup,".$currentLVL.",".$statPoints;
							} else {
									echo "xpadded,".$currentLVL.",".$statPoints;
							}
				}

		break;


		case "scavenge":
				$random = floor(rand(0,101));
				$ultrarare = 0;$rare = 0; $uncommon = 0; $common = 0; $scrap = 0;
				if($random <= 0.5){
						$ultrarare = 1;
				}
				if($random <= 3 && $random > 0.5){
						$rare = round(rand(1,2));
				}
				if($random <= 10 && $random > 3){
						$uncommon = round(rand(1,3));
				}
				if($random <= 50 && $random > 10){
						$common = round(rand(1,3));
				}
				if($random > 50){
						$scrap = round(rand(1,7));
				}

				$staminaCost = $dataToSend;
				$crystalCost = $dataToSend2;
				$q = "UPDATE users SET stamina = stamina - $staminaCost,wallet = wallet - $crystalCost WHERE discordUserID = '$userID';";
				$r2 = mysqli_query($con,$q);

				$q = "SELECT id FROM artifacts WHERE discordUserID = '$userID';";
				$r2 = mysqli_query($con,$q);
				if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {

						$q = "UPDATE artifacts SET scrap = scrap + $scrap,common = common + $common,uncommon = uncommon + $uncommon,rare = rare + $rare,ultrarare = ultrarare + $ultrarare WHERE discordUserID = '$userID';";
						$r2 = mysqli_query($con,$q);
						echo "success,".$ultrarare.",".$rare.",".$uncommon.",".$common.",".$scrap;
				} else{
						$q = "INSERT INTO artifacts (discordUserID, scrap, common, uncommon, rare, ultrarare)
						VALUES ($userID,$scrap,$common,$uncommon,$rare,$ultrarare);";
						$r2 = mysqli_query($con,$q);
						echo "success,".$ultrarare.",".$rare.",".$uncommon.",".$common.",".$scrap;
				}
		break;



		case "artifactSell":


			$q = "SELECT scrap,common,uncommon,rare,ultrarare FROM artifacts WHERE discordUserID = '$userID';";
			$r2 = mysqli_query($con,$q);
			if ( $r2 !== false && mysqli_num_rows($r2) > 0 ) {
						$a = mysqli_fetch_assoc($r2);
						$scrapQuantity=stripslashes($a['scrap']);
						$commonQuantity=stripslashes($a['common']);
						$uncommonQuantity=stripslashes($a['uncommon']);
						$rareQuantity=stripslashes($a['rare']);
						$ultrarareQuantity=stripslashes($a['ultrarare']);

						$itemToSell = strtolower ($dataToSend);
						$price = 0;$totalPayout = 0;$itemQuantity = 0;

						$price = 0.1;
						$scrapTotalPayout = round($price * $scrapQuantity);
						$price = 2;
						$commonTotalPayout = $price * $commonQuantity;
						$price = 5;
						$uncommonTotalPayout = $price * $uncommonQuantity;
						$price = 10;
						$rareTotalPayout = $price * $rareQuantity;
						$price = 30;
						$ultrarareTotalPayout = $price * $ultrarareQuantity;

						$itemQuantity = $scrapQuantity + $commonQuantity + $uncommonQuantity + $rareQuantity + $ultrarareQuantity;
						$totalPayout = $scrapTotalPayout + $commonTotalPayout + $uncommonTotalPayout + $rareTotalPayout + $ultrarareTotalPayout;

						if($itemToSell == "all"){
								$q = "UPDATE artifacts SET scrap =0,common = 0,uncommon = 0,rare = 0,ultrarare = 0 WHERE discordUserID = '$userID';";
								$r2 = mysqli_query($con,$q);
								$q = "UPDATE users SET wallet = wallet + $totalPayout  WHERE discordUserID = '$userID';";
								$r2 = mysqli_query($con,$q);
								echo "success,".$itemQuantity.",".$totalPayout;
						}else{

									$crystals = 0;
									switch ($itemToSell) {
											case "scrap":
													$singlePayout = $scrapTotalPayout;
													$itemQuantity = $scrapQuantity;
											break;
											case "common":
													$singlePayout = $commonTotalPayout;
													$itemQuantity = $commonQuantity;
											break;
											case "uncommon":
													$singlePayout = $uncommonTotalPayout;
													$itemQuantity = $uncommonQuantity;
											break;
											case "rare":
													$singlePayout = $rareTotalPayout;
													$itemQuantity = $rareQuantity;
											break;
											case "ultrarare":
													$singlePayout = $ultrarareTotalPayout;
													$itemQuantity = $ultrarareQuantity;
											break;
									}
								$q = "UPDATE artifacts SET $itemToSell = 0 WHERE discordUserID = '$userID';";
								$r2 = mysqli_query($con,$q);
								$q = "UPDATE users SET wallet = wallet + $singlePayout  WHERE discordUserID = '$userID';";
								$r2 = mysqli_query($con,$q);
								echo "success,".$itemQuantity.",".$singlePayout;
						}
					}else{
							echo "failure";
					}
		break;



		case "buyDrink":
				$q = "UPDATE users SET wallet = wallet - $dataToSend  WHERE discordUserID = '$userID';";
				$r2 = mysqli_query($con,$q);
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

	?>
