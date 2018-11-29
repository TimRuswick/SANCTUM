module.exports = {
  apps : [{
    name: 'adam',
    script: './ADAM/adam.js',
    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    autorestart: true,
    watch: true,
    max_memory_restart: '100M',
    env: {
      COMMON_VARIABLE: "true",
      NODE_ENV: "" // Doesn't do anything I think
    },
    env_production: {
      COMMON_VARIABLE: "true",
      NODE_ENV: ""
    }
  },
  {
    name: 'adam-cptmon',
    script: './ADAM_CptMon/adam-cptmon.js',
    autorestart: true,
    watch: true,
    max_memory_restart: '100M',
    env: {
      NODE_ENV: "" // Doesn't do anything I think
    },
    env_production: {
      NODE_ENV: ""
    }
  },
  {
    name: 'adam-dairo',
    script: './ADAM_Dairo/adam-dairo.js',
    autorestart: true,
    watch: true,
    max_memory_restart: '100M',
    env: {
      NODE_ENV: "" // Doesn't do anything I think
    },
    env_production: {
      NODE_ENV: ""
    }
  },
  /*
  {
    name: 'adam-ghost',
    script: './ADAM_Ghost/adam-ghost.js',
    autorestart: true,
    watch: true,
    max_memory_restart: '100M',
    env: {
      NODE_ENV: "" // Doesn't do anything I think
    },
    env_production: {
      NODE_ENV: ""
    }
  },
  */
  {
    name: 'adam-kamala',
    script: './ADAM_Kamala/adam-kamala.js',
    autorestart: true,
    watch: true,
    max_memory_restart: '100M',
    env: {
      NODE_ENV: "" // Doesn't do anything I think
    },
    env_production: {
      NODE_ENV: ""
    }
  },
  {
    name: 'alexis',
    script: './Alexis/alexis.js',
    autorestart: true,
    watch: true,
    max_memory_restart: '100M',
    env: {
      NODE_ENV: "" // Doesn't do anything I think
    },
    env_production: {
      NODE_ENV: ""
    }
  },
  /*
  {
    name: 'enemy',
    script: './Enemy/enemy.js',
    autorestart: true,
    watch: true,
    max_memory_restart: '100M',
    env: {
      NODE_ENV: "" // Doesn't do anything I think
    },
    env_production: {
      NODE_ENV: ""
    }
  },
  */
  {
    name: 'graze',
    script: './Graze/graze.js',
    autorestart: true,
    watch: true,
    max_memory_restart: '100M',
    env: {
      NODE_ENV: "" // Doesn't do anything I think
    },
    env_production: {
      NODE_ENV: ""
    }
  },
  {
    name: 'mori',
    script: './Mori/mori.js',
    autorestart: true,
    watch: true,
    max_memory_restart: '100M',
    env: {
      NODE_ENV: "" // Doesn't do anything I think
    },
    env_production: {
      NODE_ENV: ""
    }
  },
  {
    name: 'mosiah',
    script: './Mosiah/mosiah.js',
    autorestart: true,
    watch: true,
    max_memory_restart: '100M',
    env: {
      NODE_ENV: "" // Doesn't do anything I think
    },
    env_production: {
      NODE_ENV: ""
    }
  },
  {
    name: 'ravager',
    script: './Ravager_Batch/ravager.js',
    autorestart: true,
    watch: true,
    max_memory_restart: '100M',
    env: {
      NODE_ENV: "" // Doesn't do anything I think
    },
    env_production: {
      NODE_ENV: ""
    }
  },
  {
    name: 'rey',
    script: './Rey/rey.js',
    autorestart: true,
    watch: true,
    max_memory_restart: '100M',
    env: {
      NODE_ENV: "" // Doesn't do anything I think
    },
    env_production: {
      NODE_ENV: ""
    }
  },
  /*
  {
    name: 'textadv',
    script: './TextAdv/textadv.js',
    autorestart: true,
    watch: true,
    max_memory_restart: '100M',
    env: {
      NODE_ENV: "" // Doesn't do anything I think
    },
    env_production: {
      NODE_ENV: ""
    }
  },
  */
  {
    name: 'troll',
    script: './Troll/troll.js',
    autorestart: true,
    watch: true,
    max_memory_restart: '100M',
    env: {
      NODE_ENV: "" // Doesn't do anything I think
    },
    env_production: {
      NODE_ENV: ""
    }
  }],

  deploy : {
    production : {
      user : 'node',
      host : '212.83.163.1',
      ref  : 'origin/master',
      repo : 'git@github.com:repo.git',
      path : '/var/www/production',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
