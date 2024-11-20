import Image from "next/image";

export default async function Home() {

  //TODO placeholder data
  const skillsArray = [
    {
      category: 'Frontend',
      skills: [
        {
          invert: false,
          icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg',
          title: 'JavaScript'
        },
        {
          invert: false,
          icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg',
          title: 'TypeScript'
        },
        {
          invert: false,
          icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg',
          title: 'ReactJS'
        },
        {
          invert: true,
          icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-plain.svg',
          title: 'NextJS'
        },
        {
          invert: false,
          icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg',
          title: 'HTML'
        },
        {
          invert: false,
          icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg',
          title: 'TailwindCSS'
        }
      ]
    },
    {
      category: 'Backend',
      skills: [
        {
          invert: true,
          icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg',
          title: 'ExpressJS'
        },
        {
          invert: false,
          icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg',
          title: 'PostgreSQL'
        },
        {
          invert: false,
          icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg',
          title: 'MongoDB'
        },
        {
          invert: false,
          icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nestjs/nestjs-original.svg',
          title: 'NestJS'
        }
      ]
    },
    {
      category: 'Tools',
      skills: [
        {
          invert: false,
          icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg',
          title: 'Git'
        },
        {
          invert: true,
          icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vercel/vercel-original.svg',
          title: 'Vercel'
        },
        {
          invert: false,
          icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/supabase/supabase-original.svg',
          title: 'Supabase'
        },
        {
          invert: false,
          icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg',
          title: 'Docker'
        },
        {
          invert: true,
          icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/bash/bash-original.svg',
          title: 'Bash'
        }
      ]
    }
  ];

  return (
    <div className="mx-auto max-w-7xl">

      <section className="xl:mx-16 h-svh mt-10">
        <div className="flex flex-col xl:flex-row items-center xl:justify-between">
          <Image
            src='https://mtvwynyikouqzmhqespl.supabase.co/storage/v1/object/public/website/biography/propic.jpeg'
            width={400}
            height={400}
            className='rounded-2xl xl:mr-10 w-[350px] xl:w-[400px] xl:mx-0 my-20 xl:py-0'
            alt="logo"
          />
          <div className="text-center text-4xl lg:text-6xl">
            <h1 className="xl:mb-5 mb-12">Cristian <label className="text-main">Di Carlo</label></h1>
            <h2 className="">Fullstack Web Developer</h2>
          </div>
        </div>
        <div className="flex items-center text-center">
          <div>
            <h1 className="xl:text-6xl text-4xl xl:mb-20 mb-10">About me</h1>
            <p className="xl:text-left text-justify text-2xl lg:text-3xl">
              My name is <label className='text-main'>Cristian</label>, also known as Okazakee on the web. At <label className='text-main'>25</label> years old, I am a passionate <label className='text-main'>Web Developer</label> from <label className='text-main'>Italy</label>. From a young age, I have had a love for technology and have been heavily involved in the IT world. I am an avid supporter of <label className='text-main'>Open Source</label> and have experience in video editing and post production. However, in late 2021, I decided to shift my focus to Web Development. I am currently working on various personal projects and aim to become a good <label className='text-main'>Full Stack developer</label> in the near future.
              You can view my <label className='text-main'>portfolio</label> and find my social profiles to learn more about my skills and experience.</p>
          </div>
        </div>
      </section>

      <section id="skills" className="flex items-center justify-center text-center mx-5 xl:mx-16 min-h-lvh mb-32">
        <div className="w-full h-full">
          <h1 className="xl:text-6xl text-4xl mb-10 xl:mb-5">Skills & Tech Stack</h1>
          <h3 className="xl:mb-20 text-2xl mb-20">
            This section outlines the <label className='text-main'>key technologies</label> and tools that I am proficient in.
          </h3>
          {skillsArray.map((skillCategory, index) => (
            <>
              <h2 className="text-[2.66rem] my-10">{skillCategory.category}</h2>
              {/* <div className="xl:flex grid grid-cols-3 gap-2 items-center justify-items-center"> */}
              <div key={index} className="flex xl:flex-nowrap flex-wrap justify-center items-center">
                {skillsArray[index].skills.map((skill, i) => (
                <div className="mx-auto my-10 w-[calc(33.333%-1rem)]">
                  <Image
                    src={skill.icon}
                    width={80}
                    height={80}
                    className={`mx-auto w-[60px] xl:w-[80px] ${skill.invert && 'dark:invert'}`}
                    alt="stack"
                  />
                  <h3 className="mt-5 text-xl xl:text-2xl">{skill.title}</h3>
                </div>
                ))}
              </div>
            </>
          ))}
        </div>
      </section>

      <section id="portfolio" className="text-center mx-5 xl:mx-16 min-h-lvh mb-32">
        <h1 className="text-6xl mb-5 ">Portfolio</h1>
        <h3 className="mb-20 text-2xl">
          My portfolio showcases a <label className='text-main'>selection of projects</label> I have worked on. These projects cover a range of technologies and use cases and visitors can explore the <label className='text-main'>live deployments</label> of these projects and access the source code on GitHub.
        </h3>
        <div className="flex items-center border-2 border-transparent cursor-pointer hover:border-main p-5 rounded-2xl">
          <div className="min-w-[22rem] max-w-[22rem] min-h-[15rem] max-h-[15rem] relative">
            <Image
              src='https://mtvwynyikouqzmhqespl.supabase.co/storage/v1/object/public/website/biography/test%20post.png'
              fill
              className='rounded-2xl'
              alt="logo"
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />
          </div>
          <div className="flex-col">
            <h2 className="mb-2 text-4xl text-main">Weather App</h2>
            <p className="text-left text-3xl lg:text-[1.33rem] lg:leading-6 ml-10">
            Welcome to the Weather-APP project, a web application that displays weather data for three different cities (dynamic features in the future). This project was developed as part of a front-end development test and utilizes various API service to retrieve real-time weather data.
            </p>
          </div>
        </div>
        <div className="flex items-center border-2 border-transparent cursor-pointer hover:border-main p-5 rounded-2xl my-5">
          <div className="min-w-[22rem] max-w-[22rem] min-h-[15rem] max-h-[15rem] relative">
            <Image
              src='https://mtvwynyikouqzmhqespl.supabase.co/storage/v1/object/public/website/biography/mc2.png'
              fill
              className='rounded-2xl'
              alt="logo"
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />
          </div>
          <div className="flex-col">
            <h2 className="mb-2 text-4xl text-main">Minecraft Servers w/ Lazymc</h2>
            <p className="text-left text-5xl lg:text-[1.33rem] lg:leading-6 ml-10">
            This is a Linux Docker image for creating Minecraft servers with lazymc.
            Lazymc is a utility that puts your Minecraft server to rest when idle and wakes it up when players try to connect. This allows the server to not waste resources if nobody is connected.
            This image provides a basic Minecraft server using one of the supported providers. All customizations are left to the user.
            </p>
          </div>
        </div>
        <div className="flex items-center border-2 border-transparent cursor-pointer hover:border-main p-5 rounded-2xl">
          <div className="min-w-[22rem] max-w-[22rem] min-h-[15rem] max-h-[15rem] relative">
            <Image
              src='https://mtvwynyikouqzmhqespl.supabase.co/storage/v1/object/public/website/biography/ztm.png'
              fill
              className='rounded-2xl'
              alt="logo"
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />
          </div>
          <div className="flex-col">
            <h2 className="mb-2 text-4xl text-main">ZTM-Coffee-Connoisseur Project</h2>
            <p className="text-left text-5xl lg:text-[1.33rem] lg:leading-6 ml-10">
                {"This is the first NextJS WebApp project committed from the ZTM NextJS Course. The WebApp lets you find coffee stores near your location (Palermo set as default). The user can navigate through various coffee stores gathering their information such as it's name or address and can leave a star to upvote the coffee store."}
            </p>
          </div>
        </div>

        <button className="hover:bg-main bg-[#533197] transition-all px-6 py-3 rounded-xl mt-10 text-2xl text-[]">Explore more...</button>
      </section>

      <section id="blog" className="text-center mx-5 xl:mx-16 min-h-lvh">
      <h1 className="text-6xl mb-5 ">Blog</h1>
        <h3 className="mb-20 text-2xl">
        Occasional posts on interesting web development <label className='text-main'>experiences</label> and insights.
        </h3>
        <div className="flex items-center border-2 border-transparent cursor-pointer hover:border-main p-5 rounded-2xl">
          <div className="min-w-[22rem] max-w-[22rem] min-h-[15rem] max-h-[15rem] relative">
            <Image
              src='https://mtvwynyikouqzmhqespl.supabase.co/storage/v1/object/public/website/biography/blog1.jpg'
              fill
              className='rounded-2xl'
              alt="logo"
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />
          </div>
          <div className="flex-col">
            <h2 className="mb-2 text-4xl text-main">BLOG POST 1</h2>
            <p className="text-left text-5xl lg:text-[1.33rem] lg:leading-6 ml-10">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur...
            </p>
          </div>
        </div>
        <div className="flex items-center border-2 border-transparent cursor-pointer hover:border-main p-5 rounded-2xl my-5">
          <div className="min-w-[22rem] max-w-[22rem] min-h-[15rem] max-h-[15rem] relative">
            <Image
              src='https://mtvwynyikouqzmhqespl.supabase.co/storage/v1/object/public/website/biography/blog2.jpg'
              fill
              className='rounded-2xl'
              alt="logo"
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />
          </div>
          <div className="flex-col">
            <h2 className="mb-2 text-4xl text-main">BLOG POST 2</h2>
            <p className="text-left text-5xl lg:text-[1.33rem] lg:leading-6 ml-10">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur...
            </p>
          </div>
        </div>
        <div className="flex items-center border-2 border-transparent cursor-pointer hover:border-main p-5 rounded-2xl">
          <div className="min-w-[22rem] max-w-[22rem] min-h-[15rem] max-h-[15rem] relative">
            <Image
              src='https://mtvwynyikouqzmhqespl.supabase.co/storage/v1/object/public/website/biography/blog3.jpg'
              fill
              className='rounded-2xl'
              alt="logo"
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />
          </div>
          <div className="flex-col">
            <h2 className="mb-2 text-4xl text-main">BLOG POST 3</h2>
            <p className="text-left text-5xl lg:text-[1.33rem] lg:leading-6 ml-10">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur...
            </p>
          </div>
        </div>

        <button className="hover:bg-main bg-[#533197] transition-all px-6 py-3 rounded-xl mt-10 text-2xl">Explore more...</button>
      </section>

      <section id="contacts" className="flex items-center justify-center text-center mx-5 xl:mx-16 min-h-lvh">
        <div>
          <h1 className="text-6xl mb-5 ">Contacts</h1>
          <h3 className="mb-20 text-2xl">
          You can <label className='text-main'>reach out</label> to me through the following channels:
          </h3>
          <p className="text-center lg:text-3xl">
                Here contacts wunga bunga
          </p>
        </div>
      </section>
    </div>
  );
}